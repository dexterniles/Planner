-- Remove movies/TV (media) and recipes feature areas.
-- Polymorphic taggings rows referencing recipes become orphans on table drop;
-- delete them first since taggings has no FK constraint to recipes.
DELETE FROM "taggings" WHERE "taggable_type" = 'recipe';

-- Recipe child tables cascade from `recipes`, but drop them explicitly
-- in order for clarity. CASCADE is defense-in-depth.
DROP TABLE IF EXISTS "recipe_equipment" CASCADE;
DROP TABLE IF EXISTS "recipe_steps" CASCADE;
DROP TABLE IF EXISTS "recipe_ingredients" CASCADE;
DROP TABLE IF EXISTS "recipes" CASCADE;

DROP TABLE IF EXISTS "media_items" CASCADE;
DROP TYPE IF EXISTS "media_status";
DROP TYPE IF EXISTS "media_type";
