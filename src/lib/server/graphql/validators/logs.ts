import { z } from 'zod';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const dateString = z.string().regex(DATE_REGEX, 'Must be YYYY-MM-DD');

export const upsertDailyLogSchema = z.object({
	date: dateString,
	calorieGoal: z.number().int().positive().optional(),
	notes: z.string().max(1000).optional()
});

export const addFoodEntrySchema = z.object({
	date: dateString,
	foodItemId: z.string().optional(),
	foodName: z.string().min(1).max(100),
	servingSize: z.number().positive(),
	servingUnit: z.string().min(1).max(20),
	servingsConsumed: z.number().positive(),
	calories: z.number().int().nonnegative(),
	proteinG: z.number().nonnegative().optional(),
	carbsG: z.number().nonnegative().optional(),
	fatG: z.number().nonnegative().optional(),
	mealType: z
		.string()
		.transform((v) => v.toLowerCase())
		.pipe(z.enum(['breakfast', 'lunch', 'dinner', 'snack', 'other']))
		.optional()
});

export const updateFoodEntrySchema = z.object({
	servingsConsumed: z.number().positive().optional(),
	calories: z.number().int().nonnegative().optional(),
	proteinG: z.number().nonnegative().optional(),
	carbsG: z.number().nonnegative().optional(),
	fatG: z.number().nonnegative().optional(),
	mealType: z
		.string()
		.transform((v) => v.toLowerCase())
		.pipe(z.enum(['breakfast', 'lunch', 'dinner', 'snack', 'other']))
		.optional()
});

export type UpsertDailyLogInput = z.infer<typeof upsertDailyLogSchema>;
export type AddFoodEntryInput = z.infer<typeof addFoodEntrySchema>;
export type UpdateFoodEntryInput = z.infer<typeof updateFoodEntrySchema>;
