import { z } from 'zod';

// Schema for validating POST /compare request body
export const compareBodySchema = z.object({
  source: z.string({
    required_error: 'source field is required.',
    invalid_type_error: 'source must be a string.',
  }),
  candidate: z.string({
    required_error: 'candidate field is required.',
    invalid_type_error: 'candidate must be a string.',
  }),
});

export type CompareBody = z.infer<typeof compareBodySchema>;
