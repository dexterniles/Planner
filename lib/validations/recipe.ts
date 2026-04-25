import { z } from "zod";

export const createRecipeSchema = z.object({
  title: z.string().min(1, "Title is required").max(300),
  description: z.string().nullable().optional(),
  prepTimeMinutes: z.number().int().nonnegative().nullable().optional(),
  cookTimeMinutes: z.number().int().nonnegative().nullable().optional(),
  portions: z.number().int().min(1).max(999).optional(),
  notes: z.string().nullable().optional(),
  sourceUrl: z.string().max(1000).nullable().optional(),
});

export const updateRecipeSchema = createRecipeSchema.partial();

export const ingredientInputSchema = z.object({
  sortOrder: z.number().int().nonnegative().optional(),
  quantity: z.number().nonnegative().nullable().optional(),
  unit: z.string().max(40).nullable().optional(),
  name: z.string().min(1, "Ingredient name is required").max(200),
});

export const updateIngredientSchema = ingredientInputSchema.partial();

export const stepInputSchema = z.object({
  sortOrder: z.number().int().nonnegative().optional(),
  body: z.string().min(1, "Step body is required").max(2000),
  durationMinutes: z.number().int().nonnegative().nullable().optional(),
});

export const updateStepSchema = stepInputSchema.partial();

export const equipmentInputSchema = z.object({
  sortOrder: z.number().int().nonnegative().optional(),
  name: z.string().min(1, "Equipment name is required").max(120),
});

export const updateEquipmentSchema = equipmentInputSchema.partial();

export type CreateRecipeInput = z.infer<typeof createRecipeSchema>;
export type UpdateRecipeInput = z.infer<typeof updateRecipeSchema>;
export type IngredientInput = z.infer<typeof ingredientInputSchema>;
export type UpdateIngredientInput = z.infer<typeof updateIngredientSchema>;
export type StepInput = z.infer<typeof stepInputSchema>;
export type UpdateStepInput = z.infer<typeof updateStepSchema>;
export type EquipmentInput = z.infer<typeof equipmentInputSchema>;
export type UpdateEquipmentInput = z.infer<typeof updateEquipmentSchema>;
