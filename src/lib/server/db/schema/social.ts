import { pgTable, text, timestamp, pgEnum, unique, index } from 'drizzle-orm/pg-core';
import { users } from './auth';

export const friendStatusEnum = pgEnum('friend_status', ['pending', 'accepted', 'blocked']);

export const friends = pgTable(
	'friends',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		requesterId: text('requester_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		addresseeId: text('addressee_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		status: friendStatusEnum('status').notNull().default('pending'),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
	},
	(table) => [
		unique('friends_pair_unique').on(table.requesterId, table.addresseeId),
		index('friends_requester_idx').on(table.requesterId),
		index('friends_addressee_idx').on(table.addresseeId)
	]
);
