export const challengesTypeDefs = `#graphql
	type Challenge {
		id: ID!
		creator: PublicUserProfile!
		name: String!
		description: String
		challengeType: ChallengeType!
		targetValue: Int!
		startDate: Date!
		endDate: Date!
		isPublic: Boolean!
		status: ChallengeStatus!
		participants: [ChallengeParticipant!]!
		leaderboard: [LeaderboardEntry!]!
	}

	type ChallengeParticipant {
		user: PublicUserProfile!
		status: ParticipantStatus!
		joinedAt: DateTime
	}

	type LeaderboardEntry {
		rank: Int!
		user: PublicUserProfile!
		totalMetricValue: Int!
		daysParticipated: Int!
	}

	enum ChallengeType {
		CALORIE_LIMIT
		CALORIE_GOAL
		STEP_GOAL
		EXERCISE_MINUTES
		CUSTOM
	}

	enum ChallengeStatus {
		DRAFT
		ACTIVE
		COMPLETED
		CANCELLED
	}

	enum ParticipantStatus {
		INVITED
		ACCEPTED
		DECLINED
		REMOVED
	}

	input CreateChallengeInput {
		name: String!
		description: String
		challengeType: ChallengeType!
		targetValue: Int!
		startDate: Date!
		endDate: Date!
		isPublic: Boolean
		inviteUserIds: [ID!]
	}

	extend type Query {
		challenge(id: ID!): Challenge
		myChallenges: [Challenge!]!
	}

	extend type Mutation {
		createChallenge(input: CreateChallengeInput!): Challenge!
		inviteToChallenge(challengeId: ID!, userId: ID!): ChallengeParticipant!
		respondToChallenge(challengeId: ID!, accept: Boolean!): ChallengeParticipant!
		cancelChallenge(id: ID!): Challenge!
	}
`;
