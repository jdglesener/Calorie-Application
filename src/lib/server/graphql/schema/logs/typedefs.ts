export const logsTypeDefs = `#graphql
	type DailyLog {
		id: ID!
		logDate: Date!
		calorieGoal: Int
		notes: String
		entries: [FoodEntry!]!
		totalCalories: Int!
		totalProteinG: Float!
		totalCarbsG: Float!
		totalFatG: Float!
	}

	type FoodEntry {
		id: ID!
		foodItem: FoodItem
		foodName: String!
		servingSize: Float!
		servingUnit: String!
		servingsConsumed: Float!
		calories: Int!
		proteinG: Float
		carbsG: Float
		fatG: Float
		mealType: MealType!
		loggedAt: DateTime!
	}

	enum MealType {
		BREAKFAST
		LUNCH
		DINNER
		SNACK
		OTHER
	}

	input UpsertDailyLogInput {
		date: Date!
		calorieGoal: Int
		notes: String
	}

	input AddFoodEntryInput {
		date: Date!
		foodItemId: ID
		foodName: String!
		servingSize: Float!
		servingUnit: String!
		servingsConsumed: Float!
		calories: Int!
		proteinG: Float
		carbsG: Float
		fatG: Float
		mealType: MealType
	}

	input UpdateFoodEntryInput {
		servingsConsumed: Float
		calories: Int
		proteinG: Float
		carbsG: Float
		fatG: Float
		mealType: MealType
	}

	extend type Query {
		dailyLog(date: Date!): DailyLog
		dailyLogs(startDate: Date!, endDate: Date!): [DailyLog!]!
		calorieStreak: Int!
	}

	extend type Mutation {
		upsertDailyLog(input: UpsertDailyLogInput!): DailyLog!
		addFoodEntry(input: AddFoodEntryInput!): FoodEntry!
		updateFoodEntry(id: ID!, input: UpdateFoodEntryInput!): FoodEntry!
		deleteFoodEntry(id: ID!): Boolean!
	}
`;
