import { pgTable, text, integer, timestamp, numeric, pgEnum } from 'drizzle-orm/pg-core';
import { users } from './auth';

export const activityLevelEnum = pgEnum('activity_level', [
	'sedentary',
	'lightly_active',
	'moderately_active',
	'very_active',
	'extra_active'
]);

export const goalTypeEnum = pgEnum('goal_type', ['lose', 'maintain', 'gain']);

export const userProfiles = pgTable('user_profiles', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	userId: text('user_id')
		.notNull()
		.unique()
		.references(() => users.id, { onDelete: 'cascade' }),
	displayName: text('display_name'),
	avatarUrl: text('avatar_url'),
	heightCm: numeric('height_cm', { precision: 5, scale: 2 }),
	weightKg: numeric('weight_kg', { precision: 5, scale: 2 }),
	dateOfBirth: text('date_of_birth'),
	activityLevel: activityLevelEnum('activity_level').default('sedentary'),
	goalType: goalTypeEnum('goal_type').default('maintain'),
	dailyCalorieGoal: integer('daily_calorie_goal').default(2000),
	proteinGoalG: integer('protein_goal_g'),
	carbsGoalG: integer('carbs_goal_g'),
	fatGoalG: integer('fat_goal_g'),
	targetWeightKg: numeric('target_weight_kg', { precision: 5, scale: 2 }),
	sex: text('sex'),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});
