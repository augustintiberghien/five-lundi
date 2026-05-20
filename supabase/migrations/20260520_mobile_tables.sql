-- Notes coach (partagées entre tous les appareils)
CREATE TABLE IF NOT EXISTS coach_ratings (
  player_name TEXT PRIMARY KEY,
  endurance   SMALLINT NOT NULL DEFAULT 12,
  vitesse     SMALLINT NOT NULL DEFAULT 12,
  technique   SMALLINT NOT NULL DEFAULT 12,
  vision      SMALLINT NOT NULL DEFAULT 12,
  physique    SMALLINT NOT NULL DEFAULT 12,
  leadership  SMALLINT NOT NULL DEFAULT 12,
  position    TEXT,
  updated_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE coach_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_all" ON coach_ratings
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- Profils joueurs (bio, position, force/faiblesse déclarées)
CREATE TABLE IF NOT EXISTS player_profiles (
  name       TEXT PRIMARY KEY,
  bio        TEXT,
  position   TEXT NOT NULL DEFAULT 'MIL',
  strength   TEXT NOT NULL DEFAULT 'technique',
  weakness   TEXT NOT NULL DEFAULT 'endurance',
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE player_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_all" ON player_profiles
  FOR ALL TO anon USING (true) WITH CHECK (true);
