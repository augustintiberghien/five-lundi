-- Tokens Expo push pour les notifications mobiles
CREATE TABLE IF NOT EXISTS push_tokens (
  user_id    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  token      TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own token only" ON push_tokens
  FOR ALL USING (auth.uid() = user_id);

-- Service role peut tout lire (pour l'Edge Function)
CREATE POLICY "service role read all" ON push_tokens
  FOR SELECT TO service_role USING (true);
