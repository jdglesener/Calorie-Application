import { z } from 'zod';

export const lookupBarcodeSchema = z.object({
	barcode: z.string().regex(/^\d{8,14}$/, 'Barcode must be 8–14 digits')
});

export const createFoodItemSchema = z.object({
	name: z.string().min(1).max(100),
	brand: z.string().max(100).optional(),
	servingSize: z.number().positive(),
	servingUnit: z.string().min(1).max(20),
	caloriesPerServing: z.number().int().nonnegative(),
	proteinG: z.number().nonnegative().optional(),
	carbsG: z.number().nonnegative().optional(),
	fatG: z.number().nonnegative().optional(),
	fiberG: z.number().nonnegative().optional(),
	sodiumMg: z.number().nonnegative().optional()
});

export type CreateFoodItemInput = z.infer<typeof createFoodItemSchema>;
