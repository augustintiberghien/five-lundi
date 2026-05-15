import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { substitute, absentPlayer, sessionDate } = await req.json();

    if (!substitute || !absentPlayer) {
      return new Response(JSON.stringify({ error: "missing fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Credentials du groupe WhatsApp — stockés comme secrets Edge Function
    // supabase secrets set CALLMEBOT_GROUP_PHONE=336... CALLMEBOT_GROUP_APIKEY=123456
    const phone = Deno.env.get("CALLMEBOT_GROUP_PHONE");
    const apikey = Deno.env.get("CALLMEBOT_GROUP_APIKEY");

    if (!phone || !apikey) {
      console.warn("CALLMEBOT_GROUP_PHONE / CALLMEBOT_GROUP_APIKEY not configured");
      return new Response(JSON.stringify({ ok: true, notified: false, reason: "not_configured" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const msg =
      `🔔 Five Lundi — ${sessionDate}\n` +
      `${absentPlayer} est absent(e) ` +
      `→ ${substitute} est appelé(e) comme remplaçant 🟢`;

    const callUrl =
      `https://api.callmebot.com/whatsapp.php` +
      `?phone=${encodeURIComponent(phone)}` +
      `&text=${encodeURIComponent(msg)}` +
      `&apikey=${encodeURIComponent(apikey)}`;

    const resp = await fetch(callUrl);
    const body = await resp.text();
    console.log(`CallMeBot group: ${resp.status} — ${body.slice(0, 100)}`);

    return new Response(JSON.stringify({ ok: true, notified: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("notify-substitute error:", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
