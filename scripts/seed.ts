import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { foodItems } from '../src/lib/server/db/schema/food.js';
import { config } from 'dotenv';

config({ path: '.env' });

const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client);

const foods = [
	// Proteins
	{ name: 'Chicken Breast (cooked)', servingSize: '100', servingUnit: 'g', caloriesPerServing: 165, proteinG: '31', carbsG: '0', fatG: '3.6', isVerified: true },
	{ name: 'Ground Beef 80/20 (cooked)', servingSize: '100', servingUnit: 'g', caloriesPerServing: 254, proteinG: '26', carbsG: '0', fatG: '17', isVerified: true },
	{ name: 'Salmon (cooked)', servingSize: '100', servingUnit: 'g', caloriesPerServing: 208, proteinG: '20', carbsG: '0', fatG: '13', isVerified: true },
	{ name: 'Tuna (canned in water)', servingSize: '100', servingUnit: 'g', caloriesPerServing: 116, proteinG: '26', carbsG: '0', fatG: '1', isVerified: true },
	{ name: 'Eggs (large)', servingSize: '50', servingUnit: 'g', caloriesPerServing: 72, proteinG: '6', carbsG: '0.4', fatG: '5', isVerified: true },
	{ name: 'Greek Yogurt (plain, nonfat)', servingSize: '170', servingUnit: 'g', caloriesPerServing: 100, proteinG: '17', carbsG: '6', fatG: '0', isVerified: true },
	{ name: 'Cottage Cheese (1% fat)', servingSize: '113', servingUnit: 'g', caloriesPerServing: 81, proteinG: '14', carbsG: '3', fatG: '1', isVerified: true },
	{ name: 'Turkey Breast (deli sliced)', servingSize: '56', servingUnit: 'g', caloriesPerServing: 60, proteinG: '12', carbsG: '1', fatG: '0.5', isVerified: true },
	{ name: 'Shrimp (cooked)', servingSize: '100', servingUnit: 'g', caloriesPerServing: 99, proteinG: '24', carbsG: '0.2', fatG: '0.3', isVerified: true },
	{ name: 'Tilapia (cooked)', servingSize: '100', servingUnit: 'g', caloriesPerServing: 128, proteinG: '26', carbsG: '0', fatG: '3', isVerified: true },
	{ name: 'Protein Powder (whey, 1 scoop)', servingSize: '30', servingUnit: 'g', caloriesPerServing: 120, proteinG: '24', carbsG: '3', fatG: '2', isVerified: true },

	// Dairy
	{ name: 'Whole Milk', servingSize: '240', servingUnit: 'ml', caloriesPerServing: 149, proteinG: '8', carbsG: '12', fatG: '8', isVerified: true },
	{ name: 'Skim Milk', servingSize: '240', servingUnit: 'ml', caloriesPerServing: 83, proteinG: '8', carbsG: '12', fatG: '0.2', isVerified: true },
	{ name: 'Cheddar Cheese', servingSize: '28', servingUnit: 'g', caloriesPerServing: 113, proteinG: '7', carbsG: '0.4', fatG: '9', isVerified: true },
	{ name: 'Mozzarella (part-skim)', servingSize: '28', servingUnit: 'g', caloriesPerServing: 72, proteinG: '7', carbsG: '1', fatG: '4.5', isVerified: true },
	{ name: 'Butter', servingSize: '14', servingUnit: 'g', caloriesPerServing: 100, proteinG: '0', carbsG: '0', fatG: '11', isVerified: true },

	// Grains & Carbs
	{ name: 'White Rice (cooked)', servingSize: '186', servingUnit: 'g', caloriesPerServing: 242, proteinG: '4.4', carbsG: '53', fatG: '0.4', isVerified: true },
	{ name: 'Brown Rice (cooked)', servingSize: '195', servingUnit: 'g', caloriesPerServing: 216, proteinG: '5', carbsG: '45', fatG: '1.8', isVerified: true },
	{ name: 'Oatmeal (cooked)', servingSize: '234', servingUnit: 'g', caloriesPerServing: 147, proteinG: '6', carbsG: '25', fatG: '2.5', isVerified: true },
	{ name: 'Bread (white, 1 slice)', servingSize: '28', servingUnit: 'g', caloriesPerServing: 75, proteinG: '2.7', carbsG: '14', fatG: '1', isVerified: true },
	{ name: 'Bread (whole wheat, 1 slice)', servingSize: '28', servingUnit: 'g', caloriesPerServing: 69, proteinG: '3.6', carbsG: '12', fatG: '1', isVerified: true },
	{ name: 'Pasta (cooked)', servingSize: '140', servingUnit: 'g', caloriesPerServing: 220, proteinG: '8', carbsG: '43', fatG: '1.3', isVerified: true },
	{ name: 'Sweet Potato (baked)', servingSize: '130', servingUnit: 'g', caloriesPerServing: 112, proteinG: '2', carbsG: '26', fatG: '0.1', isVerified: true },
	{ name: 'Potato (baked)', servingSize: '173', servingUnit: 'g', caloriesPerServing: 161, proteinG: '4.3', carbsG: '37', fatG: '0.2', isVerified: true },
	{ name: 'Tortilla (flour, 10")', servingSize: '72', servingUnit: 'g', caloriesPerServing: 218, proteinG: '5.8', carbsG: '36', fatG: '5.5', isVerified: true },
	{ name: 'Quinoa (cooked)', servingSize: '185', servingUnit: 'g', caloriesPerServing: 222, proteinG: '8', carbsG: '39', fatG: '3.5', isVerified: true },

	// Fruits
	{ name: 'Banana (medium)', servingSize: '118', servingUnit: 'g', caloriesPerServing: 105, proteinG: '1.3', carbsG: '27', fatG: '0.4', isVerified: true },
	{ name: 'Apple (medium)', servingSize: '182', servingUnit: 'g', caloriesPerServing: 95, proteinG: '0.5', carbsG: '25', fatG: '0.3', isVerified: true },
	{ name: 'Orange (medium)', servingSize: '131', servingUnit: 'g', caloriesPerServing: 62, proteinG: '1.2', carbsG: '15', fatG: '0.2', isVerified: true },
	{ name: 'Strawberries', servingSize: '152', servingUnit: 'g', caloriesPerServing: 49, proteinG: '1', carbsG: '12', fatG: '0.5', isVerified: true },
	{ name: 'Blueberries', servingSize: '148', servingUnit: 'g', caloriesPerServing: 84, proteinG: '1.1', carbsG: '21', fatG: '0.5', isVerified: true },
	{ name: 'Grapes', servingSize: '151', servingUnit: 'g', caloriesPerServing: 104, proteinG: '1.1', carbsG: '27', fatG: '0.2', isVerified: true },
	{ name: 'Avocado (half)', servingSize: '68', servingUnit: 'g', caloriesPerServing: 114, proteinG: '1.3', carbsG: '6', fatG: '10.5', isVerified: true },

	// Vegetables
	{ name: 'Broccoli (cooked)', servingSize: '156', servingUnit: 'g', caloriesPerServing: 55, proteinG: '3.7', carbsG: '11', fatG: '0.6', isVerified: true },
	{ name: 'Spinach (raw)', servingSize: '30', servingUnit: 'g', caloriesPerServing: 7, proteinG: '0.9', carbsG: '1.1', fatG: '0.1', isVerified: true },
	{ name: 'Carrots (raw)', servingSize: '128', servingUnit: 'g', caloriesPerServing: 52, proteinG: '1.2', carbsG: '12', fatG: '0.3', isVerified: true },
	{ name: 'Mixed Salad Greens', servingSize: '85', servingUnit: 'g', caloriesPerServing: 20, proteinG: '1.7', carbsG: '3', fatG: '0.3', isVerified: true },
	{ name: 'Bell Pepper (red)', servingSize: '119', servingUnit: 'g', caloriesPerServing: 37, proteinG: '1.2', carbsG: '9', fatG: '0.4', isVerified: true },
	{ name: 'Cucumber', servingSize: '119', servingUnit: 'g', caloriesPerServing: 18, proteinG: '0.8', carbsG: '4', fatG: '0.1', isVerified: true },
	{ name: 'Corn (cooked)', servingSize: '154', servingUnit: 'g', caloriesPerServing: 177, proteinG: '5.4', carbsG: '41', fatG: '2.1', isVerified: true },

	// Fats & Nuts
	{ name: 'Olive Oil', servingSize: '14', servingUnit: 'ml', caloriesPerServing: 119, proteinG: '0', carbsG: '0', fatG: '14', isVerified: true },
	{ name: 'Almonds', servingSize: '28', servingUnit: 'g', caloriesPerServing: 164, proteinG: '6', carbsG: '6', fatG: '14', isVerified: true },
	{ name: 'Peanut Butter (2 tbsp)', servingSize: '32', servingUnit: 'g', caloriesPerServing: 190, proteinG: '7', carbsG: '7', fatG: '16', isVerified: true },
	{ name: 'Walnuts', servingSize: '28', servingUnit: 'g', caloriesPerServing: 185, proteinG: '4.3', carbsG: '4', fatG: '18.5', isVerified: true },

	// Common meals / fast food
	{ name: 'Chipotle Chicken Burrito Bowl (est.)', servingSize: '500', servingUnit: 'g', caloriesPerServing: 665, proteinG: '51', carbsG: '72', fatG: '17', isVerified: false },
	{ name: "McDonald's Big Mac", servingSize: '219', servingUnit: 'g', caloriesPerServing: 550, proteinG: '25', carbsG: '45', fatG: '30', isVerified: false },
	{ name: 'Pizza (cheese, 1 slice)', servingSize: '107', servingUnit: 'g', caloriesPerServing: 285, proteinG: '12', carbsG: '36', fatG: '10', isVerified: false },

	// Drinks
	{ name: 'Orange Juice', servingSize: '240', servingUnit: 'ml', caloriesPerServing: 112, proteinG: '1.7', carbsG: '26', fatG: '0.5', isVerified: true },
	{ name: 'Coffee (black)', servingSize: '240', servingUnit: 'ml', caloriesPerServing: 2, proteinG: '0.3', carbsG: '0', fatG: '0', isVerified: true },
	{ name: 'Coca-Cola (12 oz)', servingSize: '355', servingUnit: 'ml', caloriesPerServing: 140, proteinG: '0', carbsG: '39', fatG: '0', isVerified: true },
	{ name: 'Gatorade (20 oz)', servingSize: '591', servingUnit: 'ml', caloriesPerServing: 130, proteinG: '0', carbsG: '34', fatG: '0', isVerified: true },
];

async function seed() {
	console.log(`Seeding ${foods.length} food items...`);

	await db.insert(foodItems).values(
		foods.map((f) => ({
			name: f.name,
			servingSize: f.servingSize,
			servingUnit: f.servingUnit,
			caloriesPerServing: f.caloriesPerServing,
			proteinG: f.proteinG ?? null,
			carbsG: f.carbsG ?? null,
			fatG: f.fatG ?? null,
			isVerified: f.isVerified,
			createdBy: null
		}))
	).onConflictDoNothing();

	console.log('Done!');
	await client.end();
}

seed().catch((e) => {
	console.error(e);
	process.exit(1);
});
