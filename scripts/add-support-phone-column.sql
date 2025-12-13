-- Add support_phone column to settings table
ALTER TABLE settings 
ADD COLUMN IF NOT EXISTS support_phone TEXT NOT NULL DEFAULT '+541141624225';

-- Update existing row to have the support phone if it exists
UPDATE settings 
SET support_phone = '+541141624225' 
WHERE id = 1 AND support_phone IS NULL;
