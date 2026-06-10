-- Compo partagée des créneaux d'inscription (« sessions provisoires »)
-- Dès 10 inscrits sur un créneau : la compo générée est publiée ici,
-- identique pour tous les visiteurs (fini les compos divergentes par navigateur).
-- Chaque changement des 10 titulaires (désistement, nouvel inscrit) déclenche
-- un ré-équilibrage complet, republié pour tous.
-- Le lundi 21h30, lock-session.yml fige la compo en la promouvant dans
-- le tableau SESSIONS de index.html ; plus aucune écriture ensuite.
CREATE TABLE IF NOT EXISTS slot_sessions (
  slot_id     TEXT PRIMARY KEY,
  roster_key  TEXT NOT NULL,        -- les 10 titulaires, triés, joints par ','
  players     JSONB NOT NULL,       -- [{x, y, name, teamA}] × 10
  note_a      NUMERIC,
  note_b      NUMERIC,
  updated_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE slot_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_all" ON slot_sessions FOR ALL TO anon USING (true) WITH CHECK (true);
