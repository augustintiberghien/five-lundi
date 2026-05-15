-- Stockage des subscriptions Web Push par joueur
-- La subscription est un objet JSON {endpoint, keys: {p256dh, auth}}
-- Upsert depuis le navigateur avec la clé anon (pas de données sensibles côté client)
-- Lecture via service_role uniquement (Edge Function)

CREATE TABLE IF NOT EXISTS push_subscriptions (
  name        TEXT PRIMARY KEY,
  subscription JSONB NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Le navigateur (anon) peut insérer / mettre à jour sa propre subscription
CREATE POLICY "anon_upsert" ON push_subscriptions
  FOR ALL TO anon USING (true) WITH CHECK (true);
