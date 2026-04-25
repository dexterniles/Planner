"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CreateRecipeInput,
  UpdateRecipeInput,
  IngredientInput,
  UpdateIngredientInput,
  StepInput,
  UpdateStepInput,
  EquipmentInput,
  UpdateEquipmentInput,
} from "@/lib/validations/recipe";

interface RecipeFilters {
  q?: string;
  tagId?: string;
}

export function useRecipes(filters: RecipeFilters = {}) {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.tagId) params.set("tagId", filters.tagId);
  const query = params.toString();

  return useQuery({
    queryKey: ["recipes", filters],
    queryFn: async () => {
      const res = await fetch(`/api/recipes${query ? `?${query}` : ""}`);
      if (!res.ok) throw new Error("Failed to fetch recipes");
      return res.json();
    },
  });
}

export function useRecipe(id: string) {
  return useQuery({
    queryKey: ["recipes", id],
    queryFn: async () => {
      const res = await fetch(`/api/recipes/${id}`);
      if (!res.ok) throw new Error("Failed to fetch recipe");
      return res.json();
    },
    enabled: !!id,
  });
}

export function useCreateRecipe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateRecipeInput) => {
      const res = await fetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create recipe");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["recipes"] }),
  });
}

export function useUpdateRecipe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateRecipeInput;
    }) => {
      const res = await fetch(`/api/recipes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update recipe");
      return res.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
      queryClient.invalidateQueries({ queryKey: ["recipes", variables.id] });
    },
  });
}

export function useDeleteRecipe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/recipes/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete recipe");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["recipes"] }),
  });
}

// ─── Nested children ────────────────────────────────────────────────────────

function makeNestedHooks<TCreate, TUpdate>(segment: string) {
  function useCreate() {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: async ({ recipeId, data }: { recipeId: string; data: TCreate }) => {
        const res = await fetch(`/api/recipes/${recipeId}/${segment}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error(`Failed to create ${segment}`);
        return res.json();
      },
      onSuccess: (_data, variables) =>
        queryClient.invalidateQueries({ queryKey: ["recipes", variables.recipeId] }),
    });
  }

  function useUpdate() {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: async ({
        recipeId,
        itemId,
        data,
      }: {
        recipeId: string;
        itemId: string;
        data: TUpdate;
      }) => {
        const res = await fetch(`/api/recipes/${recipeId}/${segment}/${itemId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error(`Failed to update ${segment}`);
        return res.json();
      },
      onSuccess: (_data, variables) =>
        queryClient.invalidateQueries({ queryKey: ["recipes", variables.recipeId] }),
    });
  }

  function useDelete() {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: async ({ recipeId, itemId }: { recipeId: string; itemId: string }) => {
        const res = await fetch(`/api/recipes/${recipeId}/${segment}/${itemId}`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error(`Failed to delete ${segment}`);
        return res.json();
      },
      onSuccess: (_data, variables) =>
        queryClient.invalidateQueries({ queryKey: ["recipes", variables.recipeId] }),
    });
  }

  return { useCreate, useUpdate, useDelete };
}

const ingredientHooks = makeNestedHooks<IngredientInput, UpdateIngredientInput>("ingredients");
export const useCreateIngredient = ingredientHooks.useCreate;
export const useUpdateIngredient = ingredientHooks.useUpdate;
export const useDeleteIngredient = ingredientHooks.useDelete;

const stepHooks = makeNestedHooks<StepInput, UpdateStepInput>("steps");
export const useCreateStep = stepHooks.useCreate;
export const useUpdateStep = stepHooks.useUpdate;
export const useDeleteStep = stepHooks.useDelete;

const equipmentHooks = makeNestedHooks<EquipmentInput, UpdateEquipmentInput>("equipment");
export const useCreateEquipment = equipmentHooks.useCreate;
export const useUpdateEquipment = equipmentHooks.useUpdate;
export const useDeleteEquipment = equipmentHooks.useDelete;

// ─── Tags ───────────────────────────────────────────────────────────────────

export function useAttachRecipeTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ recipeId, tagId }: { recipeId: string; tagId: string }) => {
      const res = await fetch(`/api/recipes/${recipeId}/tags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tagId }),
      });
      if (!res.ok) throw new Error("Failed to attach tag");
      return res.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
      queryClient.invalidateQueries({ queryKey: ["recipes", variables.recipeId] });
    },
  });
}

export function useDetachRecipeTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ recipeId, tagId }: { recipeId: string; tagId: string }) => {
      const res = await fetch(`/api/recipes/${recipeId}/tags/${tagId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to detach tag");
      return res.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
      queryClient.invalidateQueries({ queryKey: ["recipes", variables.recipeId] });
    },
  });
}
