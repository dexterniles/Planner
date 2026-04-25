-- Custom SQL migration file, put your code below! --

-- Drop the orphaned daily_logs table. The Daily Log feature was removed and
-- the table was left behind in case any data needed preserving. Confirmed
-- empty before applying.

DROP TABLE IF EXISTS "daily_logs";
