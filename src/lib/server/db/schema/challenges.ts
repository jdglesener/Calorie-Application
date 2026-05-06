import {
	pgTable,
	text,
	integer,
	timestamp,
	pgEnum,
	boolean,
	unique,
	index
} from 'drizzle-orm/pg-core';
import { users } from './auth';

export const challengeTypeEnum = pgEnum('challenge_type', [
	'calorie_limit',
	'calorie_goal',
	'step_goal',
	'exercise_minutes',
	'custom'
]);

export const challengeStatusEnum = pgEnum('challenge_status', [
	'draft',
	'active',
	'completed',
	'cancelled'
]);

export const participantStatusEnum = pgEnum('participant_status', [
	'invited',
	'accepted',
	'declined',
	'removed'
]);

export const challenges = pgTable(
	'challenges',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		creatorId: text('creator_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		name: text('name').notNull(),
		description: text('description'),
		challengeType: challengeTypeEnum('challenge_type').notNull(),
		targetValue: integer('target_value').notNull(),
		startDate: text('start_date').notNull(),
		endDate: text('end_date').notNull(),
		isPublic: boolean('is_public').notNull().default(false),
		status: challengeStatusEnum('status').notNull().default('draft'),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
	},
	(table) => [
		index('challenges_creator_idx').on(table.creatorId),
		index('challenges_status_idx').on(table.status)
	]
);

export const challengeParticipants = pgTable(
	'challenge_participants',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		challengeId: text('challenge_id')
			.notNull()
			.references(() => challenges.id, { onDelete: 'cascade' }),
		userId: text('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		status: participantStatusEnum('status').notNull().default('invited'),
		joinedAt: timestamp('joined_at', { withTimezone: true }),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
	},
	(table) => [
		unique('challenge_participants_unique').on(table.challengeId, table.userId),
		index('challenge_participants_challenge_idx').on(table.challengeId),
		index('challenge_participants_user_idx').on(table.userId)
	]
);

export const challengeEntries = pgTable(
	'challenge_entries',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		challengeId: text('challenge_id')
			.notNull()
			.references(() => challenges.id, { onDelete: 'cascade' }),
		userId: text('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		entryDate: text('entry_date').notNull(),
		metricValue: integer('metric_value').notNull(),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
	},
	(table) => [
		unique('challenge_entries_unique').on(table.challengeId, table.userId, table.entryDate),
		index('challenge_entries_challenge_idx').on(table.challengeId),
		index('challenge_entries_user_idx').on(table.userId)
	]
);
