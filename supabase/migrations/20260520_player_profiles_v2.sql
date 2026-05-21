-- Mise à jour player_profiles : ajout role + colonnes optionnelles pour les coaches
ALTER TABLE player_profiles
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'player',
  ALTER COLUMN position  DROP NOT NULL,
  ALTER COLUMN strength  DROP NOT NULL,
  ALTER COLUMN weakness  DROP NOT NULL;

-- Mettre les defaults à NULL maintenant qu'elles sont optionnelles
ALTER TABLE player_profiles
  ALTER COLUMN position  SET DEFAULT NULL,
  ALTER COLUMN strength  SET DEFAULT NULL,
  ALTER COLUMN weakness  SET DEFAULT NULL;
