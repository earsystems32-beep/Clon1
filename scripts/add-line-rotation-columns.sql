-- Add line rotation columns to settings table
ALTER TABLE settings 
ADD COLUMN IF NOT EXISTS auto_rotation_enabled BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS rotation_interval_minutes INTEGER NOT NULL DEFAULT 60,
ADD COLUMN IF NOT EXISTS current_line_index INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_rotation_time TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update existing row to have rotation settings
UPDATE settings 
SET auto_rotation_enabled = false,
    rotation_interval_minutes = 60,
    current_line_index = 0,
    last_rotation_time = NOW()
WHERE id = 1;
