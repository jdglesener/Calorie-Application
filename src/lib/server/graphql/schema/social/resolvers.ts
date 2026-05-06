import { eq, and, or } from 'drizzle-orm';
import { friends, users, userProfiles } from '$lib/server/db/schema';
import { requireAuth } from '$lib/server/auth/middleware';
import type { GraphQLContext } from '$lib/server/graphql/context';
import { GraphQLError } from 'graphql';

async function getPublicProfile(ctx: GraphQLContext, userId: string) {
	const [row] = await ctx.db
		.select({
			id: users.id,
			name: users.name,
			displayName: userProfiles.displayName,
			avatarUrl: userProfiles.avatarUrl
		})
		.from(users)
		.leftJoin(userProfiles, eq(users.id, userProfiles.userId))
		.where(eq(users.id, userId))
		.limit(1);
	return row ?? null;
}

export const socialResolvers = {
	Query: {
		friends: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
			const user = requireAuth(ctx);
			const rows = await ctx.db
				.select()
				.from(friends)
				.where(
					and(
						or(eq(friends.requesterId, user.id), eq(friends.addresseeId, user.id)),
						eq(friends.status, 'accepted')
					)
				);
			return rows.map((r) => ({
				id: r.id,
				friendId: r.requesterId === user.id ? r.addresseeId : r.requesterId,
				status: r.status.toUpperCase(),
				createdAt: r.createdAt
			}));
		},

		pendingFriendRequests: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
			const user = requireAuth(ctx);
			const rows = await ctx.db
				.select()
				.from(friends)
				.where(and(eq(friends.addresseeId, user.id), eq(friends.status, 'pending')));
			return rows.map((r) => ({
				id: r.id,
				friendId: r.requesterId,
				status: 'PENDING',
				createdAt: r.createdAt
			}));
		}
	},

	Mutation: {
		sendFriendRequest: async (
			_: unknown,
			{ userId }: { userId: string },
			ctx: GraphQLContext
		) => {
			const user = requireAuth(ctx);
			if (userId === user.id) {
				throw new GraphQLError('Cannot send friend request to yourself');
			}

			const [existing] = await ctx.db
				.select()
				.from(friends)
				.where(
					or(
						and(eq(friends.requesterId, user.id), eq(friends.addresseeId, userId)),
						and(eq(friends.requesterId, userId), eq(friends.addresseeId, user.id))
					)
				)
				.limit(1);

			if (existing) {
				throw new GraphQLError('Friend request already exists');
			}

			const [conn] = await ctx.db
				.insert(friends)
				.values({ requesterId: user.id, addresseeId: userId, status: 'pending' })
				.returning();

			return { id: conn.id, friendId: userId, status: 'PENDING', createdAt: conn.createdAt };
		},

		respondToFriendRequest: async (
			_: unknown,
			{ connectionId, accept }: { connectionId: string; accept: boolean },
			ctx: GraphQLContext
		) => {
			const user = requireAuth(ctx);

			const [conn] = await ctx.db
				.select()
				.from(friends)
				.where(and(eq(friends.id, connectionId), eq(friends.addresseeId, user.id)))
				.limit(1);

			if (!conn) {
				throw new GraphQLError('Friend request not found', {
					extensions: { code: 'NOT_FOUND' }
				});
			}

			const newStatus = accept ? 'accepted' : 'declined';
			const [updated] = await ctx.db
				.update(friends)
				.set({ status: newStatus as 'accepted' | 'declined', updatedAt: new Date() })
				.where(eq(friends.id, connectionId))
				.returning();

			return {
				id: updated.id,
				friendId: updated.requesterId,
				status: newStatus.toUpperCase(),
				createdAt: updated.createdAt
			};
		},

		removeFriend: async (_: unknown, { userId }: { userId: string }, ctx: GraphQLContext) => {
			const user = requireAuth(ctx);
			await ctx.db
				.delete(friends)
				.where(
					or(
						and(eq(friends.requesterId, user.id), eq(friends.addresseeId, userId)),
						and(eq(friends.requesterId, userId), eq(friends.addresseeId, user.id))
					)
				);
			return true;
		},

		blockUser: async (_: unknown, { userId }: { userId: string }, ctx: GraphQLContext) => {
			const user = requireAuth(ctx);

			await ctx.db
				.delete(friends)
				.where(
					or(
						and(eq(friends.requesterId, user.id), eq(friends.addresseeId, userId)),
						and(eq(friends.requesterId, userId), eq(friends.addresseeId, user.id))
					)
				);

			await ctx.db
				.insert(friends)
				.values({ requesterId: user.id, addresseeId: userId, status: 'blocked' });

			return true;
		}
	},

	FriendConnection: {
		friend: (parent: { friendId: string }, _: unknown, ctx: GraphQLContext) =>
			getPublicProfile(ctx, parent.friendId)
	}
};
