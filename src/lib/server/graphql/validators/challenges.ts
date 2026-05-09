import { z } from 'zod';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const dateString = z.string().regex(DATE_REGEX, 'Must be YYYY-MM-DD');

export const createChallengeSchema = z
	.object({
		name: z.string().min(1).max(100),
		description: z.string().max(1000).optional(),
		challengeType: z.preprocess(
			(v) => String(v).toLowerCase(),
			z.enum(['calorie_limit', 'calorie_goal', 'step_goal', 'exercise_minutes', 'custom'])
		),
		targetValue: z.number().int().positive(),
		startDate: dateString,
		endDate: dateString,
		isPublic: z.boolean().optional(),
		inviteUserIds: z.array(z.string()).max(50).optional()
	})
	.refine((d) => d.endDate > d.startDate, {
		message: 'endDate must be after startDate',
		path: ['endDate']
	});

export type CreateChallengeInput = z.infer<typeof createChallengeSchema>;
