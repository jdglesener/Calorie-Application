import {
	pgTable,
	text,
	integer,
	numeric,
	timestamp,
	unique,
	index,
	pgEnum
} from 'drizzle-orm/pg-core';
import { users } from './auth';
import { foodItems } from './food';

export const mealTypeEnum = pgEnum('meal_type', [
	'breakfast',
	'lunch',
	'dinner',
	'snack',
	'other'
]);

export const dailyLogs = pgTable(
	'daily_logs',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		userId: text('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		logDate: text('log_date').notNull(),
		calorieGoal: integer('calorie_goal'),
		notes: text('notes'),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
	},
	(table) => [
		unique('daily_logs_user_date_unique').on(table.userId, table.logDate),
		index('daily_logs_user_id_idx').on(table.userId),
		index('daily_logs_log_date_idx').on(table.logDate)
	]
);

export const foodEntries = pgTable(
	'food_entries',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		dailyLogId: text('daily_log_id')
			.notNull()
			.references(() => dailyLogs.id, { onDelete: 'cascade' }),
		foodItemId: text('food_item_id').references(() => foodItems.id, { onDelete: 'set null' }),
		foodName: text('food_name').notNull(),
		servingSize: numeric('serving_size', { precision: 8, scale: 2 }).notNull(),
		servingUnit: text('serving_unit').notNull(),
		servingsConsumed: numeric('servings_consumed', { precision: 6, scale: 2 })
			.notNull()
			.default('1'),
		calories: integer('calories').notNull(),
		proteinG: numeric('protein_g', { precision: 7, scale: 2 }),
		carbsG: numeric('carbs_g', { precision: 7, scale: 2 }),
		fatG: numeric('fat_g', { precision: 7, scale: 2 }),
		mealType: mealTypeEnum('meal_type').default('other'),
		loggedAt: timestamp('logged_at', { withTimezone: true }).notNull().defaultNow()
	},
	(table) => [index('food_entries_daily_log_id_idx').on(table.dailyLogId)]
);
