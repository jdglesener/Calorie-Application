export const socialTypeDefs = `#graphql
	type FriendConnection {
		id: ID!
		friend: PublicUserProfile!
		status: FriendStatus!
		createdAt: DateTime!
	}

	enum FriendStatus {
		PENDING
		ACCEPTED
		BLOCKED
	}

	extend type Query {
		friends: [FriendConnection!]!
		pendingFriendRequests: [FriendConnection!]!
	}

	extend type Mutation {
		sendFriendRequest(userId: ID!): FriendConnection!
		respondToFriendRequest(connectionId: ID!, accept: Boolean!): FriendConnection!
		removeFriend(userId: ID!): Boolean!
		blockUser(userId: ID!): Boolean!
	}
`;
