export const foodTypeDefs = `#graphql
	type FoodItem {
		id: ID!
		name: String!
		brand: String
		servingSize: Float!
		servingUnit: String!
		caloriesPerServing: Int!
		proteinG: Float
		carbsG: Float
		fatG: Float
		fiberG: Float
		sodiumMg: Float
		isVerified: Boolean!
	}

	input CreateFoodItemInput {
		name: String!
		brand: String
		servingSize: Float!
		servingUnit: String!
		caloriesPerServing: Int!
		proteinG: Float
		carbsG: Float
		fatG: Float
		fiberG: Float
		sodiumMg: Float
	}

	extend type Query {
		searchFoods(query: String!, limit: Int): [FoodItem!]!
		foodItem(id: ID!): FoodItem
	}

	extend type Mutation {
		createFoodItem(input: CreateFoodItemInput!): FoodItem!
	}
`;
