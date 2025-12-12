-- Create system_config table to store app configuration
CREATE TABLE IF NOT EXISTS system_config (
  id INTEGER PRIMARY KEY DEFAULT 1,
  alias TEXT NOT NULL DEFAULT 'DLHogar.mp',
  phone TEXT NOT NULL DEFAULT '5493815184003',
  payment_type TEXT NOT NULL DEFAULT 'Alias',
  user_creation_enabled BOOLEAN NOT NULL DEFAULT true,
  timer_seconds INTEGER NOT NULL DEFAULT 30,
  min_amount INTEGER NOT NULL DEFAULT 2000,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT single_row CHECK (id = 1)
);

-- Insert default configuration if not exists
INSERT INTO system_config (id, alias, phone, payment_type, user_creation_enabled, timer_seconds, min_amount)
VALUES (1, 'DLHogar.mp', '5493815184003', 'Alias', true, 30, 2000)
ON CONFLICT (id) DO NOTHING;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_system_config_updated_at ON system_config(updated_at);
