-- Sessions (nouvelles sessions créées depuis l'app mobile)
CREATE TABLE IF NOT EXISTS sessions (
  id              TEXT PRIMARY KEY,
  date            TEXT NOT NULL,
  date_iso        DATE NOT NULL,
  score           TEXT NOT NULL DEFAULT '— vs —',
  score_winner    TEXT NOT NULL DEFAULT '',
  name_a          TEXT NOT NULL DEFAULT 'Blanche ⚪',
  name_b          TEXT NOT NULL DEFAULT 'Bleue 🔵',
  inscriptions_open BOOLEAN NOT NULL DEFAULT true,
  max_players     INTEGER NOT NULL DEFAULT 10,
  confirmed_count INTEGER NOT NULL DEFAULT 0,
  bench_count     INTEGER NOT NULL DEFAULT 0,
  time            TEXT,
  location        TEXT,
  mvp             TEXT,
  vote_open       BOOLEAN DEFAULT false,
  article         TEXT,
  players         JSONB,
  compo           JSONB,
  created_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_all" ON sessions FOR ALL TO anon USING (true) WITH CHECK (true);

-- Inscriptions joueurs par session
CREATE TABLE IF NOT EXISTS registrations (
  session_id      TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  player_name     TEXT NOT NULL,
  status          TEXT NOT NULL CHECK (status IN ('confirmed', 'bench', 'absent')),
  bench_position  INTEGER,
  registered_at   TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (session_id, player_name)
);

ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_all" ON registrations FOR ALL TO anon USING (true) WITH CHECK (true);
