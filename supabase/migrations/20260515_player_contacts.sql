-- Table pour les contacts CallMeBot de chaque joueur
-- phone : format international sans "+", ex: "33612345678"
-- callmebot_apikey : clé personnelle obtenue via https://www.callmebot.com/blog/free-api-whatsapp-messages/
-- Chaque joueur s'inscrit une seule fois en envoyant un message WhatsApp à CallMeBot

CREATE TABLE IF NOT EXISTS player_contacts (
  name              TEXT PRIMARY KEY,
  phone             TEXT,
  callmebot_apikey  TEXT,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

-- Accès en lecture pour les Edge Functions (service role uniquement)
ALTER TABLE player_contacts ENABLE ROW LEVEL SECURITY;

-- Aucun accès public (anon) — seul le service_role peut lire/écrire
CREATE POLICY "service_role_only" ON player_contacts
  USING (false)
  WITH CHECK (false);
