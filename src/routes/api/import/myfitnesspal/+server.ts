import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { unzipSync } from 'fflate';
import { db } from '$lib/server/db/client';
import { dailyLogs, foodEntries } from '$lib/server/db/schema';

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'other';

const MEAL_NAMES: Record<string, MealType> = {
	breakfast: 'breakfast',
	lunch: 'lunch',
	dinner: 'dinner',
	snacks: 'snack',
	snack: 'snack'
};

function parseCsv(text: string): string[][] {
	const rows: string[][] = [];
	let field = '';
	let inQuote = false;
	let row: string[] = [];

	for (let i = 0; i < text.length; i++) {
		const ch = text[i];
		if (inQuote) {
			if (ch === '"' && text[i + 1] === '"') { field += '"'; i++; }
			else if (ch === '"') inQuote = false;
			else field += ch;
		} else {
			if (ch === '"') { inQuote = true; }
			else if (ch === ',') { row.push(field); field = ''; }
			else if (ch === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
			else if (ch !== '\r') { field += ch; }
		}
	}
	if (field || row.length) { row.push(field); rows.push(row); }
	return rows;
}

function toNum(s: string | undefined): number | null {
	const n = parseFloat(s ?? '');
	return isNaN(n) ? null : n;
}

function toInt(s: string | undefined): number {
	const n = parseInt(s ?? '0', 10);
	return isNaN(n) ? 0 : n;
}

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) throw error(401, 'Unauthorized');
	const userId = locals.user.id;

	const formData = await request.formData();
	const file = formData.get('file');
	if (!(file instanceof File)) throw error(400, 'No file uploaded');
	if (!file.name.toLowerCase().endsWith('.zip')) throw error(400, 'Expected a .zip file');

	const bytes = new Uint8Array(await file.arrayBuffer());
	let unzipped: ReturnType<typeof unzipSync>;
	try {
		unzipped = unzipSync(bytes);
	} catch {
		throw error(400, 'Could not read ZIP file');
	}

	const csvKey = Object.keys(unzipped).find(
		(k) => k.toLowerCase().includes('food') && k.toLowerCase().endsWith('.csv')
	);
	if (!csvKey) throw error(400, 'No food diary CSV found in ZIP. Make sure you uploaded your MyFitnessPal export.');

	const csvText = new TextDecoder('utf-8').decode(unzipped[csvKey]);
	const rows = parseCsv(csvText);
	if (rows.length < 2) throw error(400, 'CSV appears empty');

	// Normalise header names
	const headers = rows[0].map((h) => h.toLowerCase().trim());
	const col = (name: string) => headers.indexOf(name);

	const dateCol = col('date');
	const mealCol = col('meal');
	const calCol = col('calories');
	const fatCol = col('fat (g)');
	const carbCol = col('carbohydrates (g)');
	const proteinCol = col('protein (g)');
	const sodiumCol = col('sodium (mg)');
	const fiberCol = col('fiber (g)');

	if (dateCol === -1 || mealCol === -1 || calCol === -1) {
		throw error(400, 'Unrecognised CSV format. Expected MyFitnessPal food diary export.');
	}

	// Group food rows by date + tracked current meal
	type FoodRow = {
		foodName: string;
		calories: number;
		proteinG: number | null;
		carbsG: number | null;
		fatG: number | null;
		fiberG: number | null;
		sodiumMg: number | null;
		mealType: MealType;
	};

	const byDate = new Map<string, FoodRow[]>();
	let currentMeal: MealType = 'other';

	for (let i = 1; i < rows.length; i++) {
		const row = rows[i];
		if (row.length < 3) continue;

		const date = row[dateCol]?.trim();
		const mealCell = row[mealCol]?.trim();
		const calCell = row[calCol]?.trim();

		if (!date || !mealCell) continue;

		// Detect meal headers and totals rows
		const mealLower = mealCell.toLowerCase();
		if (MEAL_NAMES[mealLower] !== undefined) {
			currentMeal = MEAL_NAMES[mealLower];
			continue;
		}
		if (mealLower.includes('total') || mealLower === '') continue;

		const calories = toInt(calCell);
		if (calories === 0 && !calCell) continue; // blank calorie = header row

		if (!byDate.has(date)) byDate.set(date, []);
		byDate.get(date)!.push({
			foodName: mealCell,
			calories,
			proteinG: toNum(row[proteinCol]),
			carbsG: toNum(row[carbCol]),
			fatG: toNum(row[fatCol]),
			fiberG: toNum(row[fiberCol]),
			sodiumMg: toNum(row[sodiumCol]),
			mealType: currentMeal
		});
	}

	if (byDate.size === 0) throw error(400, 'No food entries found in the CSV.');

	let daysImported = 0;
	let entriesImported = 0;

	for (const [logDate, items] of byDate) {
		// Upsert the daily log (merge — don't overwrite existing notes/goals)
		const [log] = await db
			.insert(dailyLogs)
			.values({ userId, logDate })
			.onConflictDoUpdate({
				target: [dailyLogs.userId, dailyLogs.logDate],
				set: { updatedAt: new Date() }
			})
			.returning();

		// Append entries (merge strategy: always insert, never overwrite existing)
		await db.insert(foodEntries).values(
			items.map((item) => ({
				dailyLogId: log.id,
				foodName: item.foodName,
				servingSize: '1',
				servingUnit: 'serving',
				servingsConsumed: '1',
				calories: item.calories,
				proteinG: item.proteinG != null ? String(item.proteinG) : undefined,
				carbsG: item.carbsG != null ? String(item.carbsG) : undefined,
				fatG: item.fatG != null ? String(item.fatG) : undefined,
				mealType: item.mealType
			}))
		);

		daysImported++;
		entriesImported += items.length;
	}

	return json({ daysImported, entriesImported });
};
