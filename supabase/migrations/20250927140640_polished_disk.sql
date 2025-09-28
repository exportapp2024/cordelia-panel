/*
  # Create agent_settings table

  1. New Tables
    - `agent_settings`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles, unique)
      - `connected` (boolean)
      - `version` (text)
      - `last_sync` (timestamp)
      - `calendar_connected` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `agent_settings` table
    - Add policies for CRUD operations
*/

-- Create agent_settings table
CREATE TABLE IF NOT EXISTS agent_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  connected boolean DEFAULT false,
  version text DEFAULT '1.0.0',
  last_sync timestamptz DEFAULT now(),
  calendar_connected boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE agent_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own agent settings"
  ON agent_settings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own agent settings"
  ON agent_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own agent settings"
  ON agent_settings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_agent_settings_updated_at ON agent_settings;
CREATE TRIGGER update_agent_settings_updated_at
  BEFORE UPDATE ON agent_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to handle new profile creation (auto-create agent settings)
CREATE OR REPLACE FUNCTION handle_new_profile()
RETURNS trigger AS $$
BEGIN
  INSERT INTO agent_settings (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new profile creation
DROP TRIGGER IF EXISTS on_profile_created ON profiles;
CREATE TRIGGER on_profile_created
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION handle_new_profile();