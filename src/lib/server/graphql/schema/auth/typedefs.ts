export const authTypeDefs = `#graphql
	type User {
		id: ID!
		name: String!
		email: String!
		emailVerified: Boolean!
		profile: UserProfile
		createdAt: DateTime!
	}

	type UserProfile {
		id: ID!
		displayName: String
		avatarUrl: String
		heightCm: Float
		weightKg: Float
		dateOfBirth: Date
		activityLevel: ActivityLevel
		goalType: GoalType
		dailyCalorieGoal: Int
	}

	type PublicUserProfile {
		id: ID!
		name: String!
		displayName: String
		avatarUrl: String
	}

	enum ActivityLevel {
		SEDENTARY
		LIGHTLY_ACTIVE
		MODERATELY_ACTIVE
		VERY_ACTIVE
		EXTRA_ACTIVE
	}

	enum GoalType {
		LOSE
		MAINTAIN
		GAIN
	}

	input UpdateProfileInput {
		displayName: String
		heightCm: Float
		weightKg: Float
		dateOfBirth: Date
		activityLevel: ActivityLevel
		goalType: GoalType
		dailyCalorieGoal: Int
	}

	extend type Query {
		me: User
		searchUsers(query: String!, limit: Int): [PublicUserProfile!]!
	}

	extend type Mutation {
		updateProfile(input: UpdateProfileInput!): UserProfile!
	}
`;
