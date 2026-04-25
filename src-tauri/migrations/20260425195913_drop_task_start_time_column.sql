-- Remove start_time column from tasks (time blocks are now in their own table)
ALTER TABLE tasks DROP COLUMN start_time;
