import { pgTable, text, integer, numeric, timestamp, boolean, index, unique } from 'drizzle-orm/pg-core';
import { users } from './auth';

export const foodItems = pgTable(
	'food_items',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		createdBy: text('created_by').references(() => users.id, { onDelete: 'set null' }),
		name: text('name').notNull(),
		brand: text('brand'),
		servingSize: numeric('serving_size', { precision: 8, scale: 2 }).notNull().default('100'),
		servingUnit: text('serving_unit').notNull().default('g'),
		caloriesPerServing: integer('calories_per_serving').notNull(),
		proteinG: numeric('protein_g', { precision: 7, scale: 2 }),
		carbsG: numeric('carbs_g', { precision: 7, scale: 2 }),
		fatG: numeric('fat_g', { precision: 7, scale: 2 }),
		fiberG: numeric('fiber_g', { precision: 7, scale: 2 }),
		sodiumMg: numeric('sodium_mg', { precision: 8, scale: 2 }),
		isVerified: boolean('is_verified').notNull().default(false),
		externalId: text('external_id'),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
	},
	(table) => [
		index('food_items_name_idx').on(table.name),
		index('food_items_created_by_idx').on(table.createdBy),
		unique('food_items_external_id_unique').on(table.externalId)
	]
);
