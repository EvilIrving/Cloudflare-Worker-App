-- Add new column with default value
ALTER TABLE ruozhi ADD COLUMN isUsed BOOLEAN NOT NULL DEFAULT false;

-- Update existing records if needed (optional)
UPDATE ruozhi SET isUsed = false;
