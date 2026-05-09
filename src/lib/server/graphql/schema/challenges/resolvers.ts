import { eq, and, or, sql } from 'drizzle-orm';
import {
	challenges,
	challengeParticipants,
	challengeEntries,
	users,
	userProfiles
} from '$lib/server/db/schema';
import { requireAuth } from '$lib/server/auth/middleware';
import { createChallengeSchema } from '$lib/server/graphql/validators/challenges';
import type { GraphQLContext } from '$lib/server/graphql/context';
import { GraphQLError } from 'graphql';

async function assertParticipant(ctx: GraphQLContext, challengeId: string, userId: string) {
	const [p] = await ctx.db
		.select({ id: challengeParticipants.id })
		.from(challengeParticipants)
		.where(
			and(
				eq(challengeParticipants.challengeId, challengeId),
				eq(challengeParticipants.userId, userId),
				eq(challengeParticipants.status, 'accepted')
			)
		)
		.limit(1);
	return !!p;
}

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

export const challengesResolvers = {
	Query: {
		challenge: async (_: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
			const user = requireAuth(ctx);
			const [c] = await ctx.db
				.select()
				.from(challenges)
				.where(eq(challenges.id, id))
				.limit(1);
			if (!c) return null;

			const isParticipant = await assertParticipant(ctx, id, user.id);
			if (!c.isPublic && c.creatorId !== user.id && !isParticipant) return null;
			return c;
		},

		myChallenges: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
			const user = requireAuth(ctx);
			const participantRows = await ctx.db
				.select({ challengeId: challengeParticipants.challengeId })
				.from(challengeParticipants)
				.where(
					and(
						eq(challengeParticipants.userId, user.id),
						or(
							eq(challengeParticipants.status, 'accepted'),
							eq(challengeParticipants.status, 'invited')
						)
					)
				);
			const ids = participantRows.map((r) => r.challengeId);
			if (ids.length === 0) {
				return ctx.db.select().from(challenges).where(eq(challenges.creatorId, user.id));
			}
			return ctx.db
				.select()
				.from(challenges)
				.where(
					or(
						eq(challenges.creatorId, user.id),
						sql`${challenges.id} = ANY(${sql.raw(`ARRAY[${ids.map((id) => `'${id}'`).join(',')}]::text[]`)})`
					)
				);
		}
	},

	Mutation: {
		createChallenge: async (
			_: unknown,
			{ input }: { input: unknown },
			ctx: GraphQLContext
		) => {
			const user = requireAuth(ctx);
			const validated = createChallengeSchema.parse(input);

			const [challenge] = await ctx.db
				.insert(challenges)
				.values({
					creatorId: user.id,
					name: validated.name,
					description: validated.description,
					challengeType: validated.challengeType,
					targetValue: validated.targetValue,
					startDate: validated.startDate,
					endDate: validated.endDate,
					isPublic: validated.isPublic ?? false,
					status: 'active'
				})
				.returning();

			await ctx.db.insert(challengeParticipants).values({
				challengeId: challenge.id,
				userId: user.id,
				status: 'accepted',
				joinedAt: new Date()
			});

			if (validated.inviteUserIds?.length) {
				await ctx.db.insert(challengeParticipants).values(
					validated.inviteUserIds.map((uid) => ({
						challengeId: challenge.id,
						userId: uid,
						status: 'invited' as const
					}))
				);
			}

			return challenge;
		},

		inviteToChallenge: async (
			_: unknown,
			{ challengeId, userId }: { challengeId: string; userId: string },
			ctx: GraphQLContext
		) => {
			const user = requireAuth(ctx);
			const [c] = await ctx.db
				.select({ creatorId: challenges.creatorId })
				.from(challenges)
				.where(eq(challenges.id, challengeId))
				.limit(1);

			if (!c || c.creatorId !== user.id) {
				throw new GraphQLError('Not authorized to invite to this challenge');
			}

			const [p] = await ctx.db
				.insert(challengeParticipants)
				.values({ challengeId, userId, status: 'invited' })
				.onConflictDoNothing()
				.returning();

			if (!p) throw new GraphQLError('User already invited or participating');

			const profile = await getPublicProfile(ctx, userId);
			return { user: profile, status: 'INVITED', joinedAt: null };
		},

		respondToChallenge: async (
			_: unknown,
			{ challengeId, accept }: { challengeId: string; accept: boolean },
			ctx: GraphQLContext
		) => {
			const user = requireAuth(ctx);
			const [p] = await ctx.db
				.select()
				.from(challengeParticipants)
				.where(
					and(
						eq(challengeParticipants.challengeId, challengeId),
						eq(challengeParticipants.userId, user.id),
						eq(challengeParticipants.status, 'invited')
					)
				)
				.limit(1);

			if (!p) {
				throw new GraphQLError('Invitation not found', { extensions: { code: 'NOT_FOUND' } });
			}

			const newStatus = accept ? 'accepted' : 'declined';
			await ctx.db
				.update(challengeParticipants)
				.set({
					status: newStatus as 'accepted' | 'declined',
					joinedAt: accept ? new Date() : null
				})
				.where(eq(challengeParticipants.id, p.id));

			const profile = await getPublicProfile(ctx, user.id);
			return {
				user: profile,
				status: newStatus.toUpperCase(),
				joinedAt: accept ? new Date() : null
			};
		},

		cancelChallenge: async (_: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
			const user = requireAuth(ctx);
			const [c] = await ctx.db
				.select()
				.from(challenges)
				.where(and(eq(challenges.id, id), eq(challenges.creatorId, user.id)))
				.limit(1);

			if (!c) throw new GraphQLError('Challenge not found or not authorized');

			const [updated] = await ctx.db
				.update(challenges)
				.set({ status: 'cancelled', updatedAt: new Date() })
				.where(eq(challenges.id, id))
				.returning();

			return updated;
		}
	},

	Challenge: {
		creator: (parent: { creatorId: string }, _: unknown, ctx: GraphQLContext) =>
			getPublicProfile(ctx, parent.creatorId),

		challengeType: (parent: { challengeType: string }) =>
			parent.challengeType.toUpperCase(),

		status: (parent: { status: string }) => parent.status.toUpperCase(),

		participants: async (parent: { id: string }, _: unknown, ctx: GraphQLContext) => {
			const rows = await ctx.db
				.select()
				.from(challengeParticipants)
				.where(eq(challengeParticipants.challengeId, parent.id));

			return Promise.all(
				rows.map(async (r) => ({
					user: await getPublicProfile(ctx, r.userId),
					status: r.status.toUpperCase(),
					joinedAt: r.joinedAt
				}))
			);
		},

		leaderboard: async (parent: { id: string }, _: unknown, ctx: GraphQLContext) => {
			const rows = await ctx.db
				.select({
					userId: challengeEntries.userId,
					total: sql<number>`sum(${challengeEntries.metricValue})`,
					days: sql<number>`count(*)::int`
				})
				.from(challengeEntries)
				.where(eq(challengeEntries.challengeId, parent.id))
				.groupBy(challengeEntries.userId);

			const sorted = [...rows].sort((a, b) => (b.total ?? 0) - (a.total ?? 0));

			return Promise.all(
				sorted.map(async (r, i) => ({
					rank: i + 1,
					user: await getPublicProfile(ctx, r.userId),
					totalMetricValue: r.total ?? 0,
					daysParticipated: r.days ?? 0
				}))
			);
		}
	}
};
