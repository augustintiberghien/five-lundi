import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type NotifType = "vote_open" | "compo_published" | "presence_reminder";

const MESSAGES: Record<NotifType, { title: string; body: string }> = {
  vote_open: {
    title: "Vote MVP ouvert 🏆",
    body: "Qui a été le meilleur ce soir ? Votez maintenant !",
  },
  compo_published: {
    title: "La compo est tombée ⚽",
    body: "Les équipes sont formées, va voir qui joue !",
  },
  presence_reminder: {
    title: "Rappel lundi ⏰",
    body: "Tu joues lundi ? Confirme ta présence avant ce soir !",
  },
};

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS });
  }

  try {
    const { type, sessionId } = (await req.json()) as {
      type: NotifType;
      sessionId: string;
    };

    if (!type || !sessionId || !MESSAGES[type]) {
      return json({ error: "missing or invalid fields" }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: rows, error } = await supabase
      .from("push_tokens")
      .select("token");

    if (error) throw error;
    if (!rows || rows.length === 0) {
      return json({ ok: true, sent: 0, reason: "no_tokens" });
    }

    const msg = MESSAGES[type];
    const messages = rows.map(({ token }) => ({
      to: token,
      title: msg.title,
      body: msg.body,
      data: { sessionId, type },
      sound: "default",
    }));

    // Expo recommande des chunks de 100
    const chunks: typeof messages[] = [];
    for (let i = 0; i < messages.length; i += 100) {
      chunks.push(messages.slice(i, i + 100));
    }

    let sent = 0;
    for (const chunk of chunks) {
      const res = await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(chunk),
      });
      if (res.ok) sent += chunk.length;
    }

    console.log(`send-push: ${type} / session ${sessionId} → ${sent} tokens notified`);
    return json({ ok: true, sent });
  } catch (e) {
    console.error("send-push error:", e);
    return json({ error: String(e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}
