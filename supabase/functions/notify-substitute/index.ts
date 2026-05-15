import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { substitute, absentPlayer, sessionId, sessionDate } = await req.json();

    if (!substitute || !absentPlayer) {
      return new Response(JSON.stringify({ error: "missing fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: contact, error } = await supabase
      .from("player_contacts")
      .select("phone, callmebot_apikey")
      .eq("name", substitute)
      .maybeSingle();

    if (error || !contact?.phone || !contact?.callmebot_apikey) {
      console.log(`No contact info for ${substitute}`);
      return new Response(JSON.stringify({ ok: true, notified: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const msg =
      `🟢 Five Lundi — ${sessionDate}\n` +
      `${absentPlayer} est absent(e). Tu es appelé(e) comme remplaçant !\n` +
      `Confirme ta présence dans l'app 👊`;

    const callUrl =
      `https://api.callmebot.com/whatsapp.php` +
      `?phone=${encodeURIComponent(contact.phone)}` +
      `&text=${encodeURIComponent(msg)}` +
      `&apikey=${encodeURIComponent(contact.callmebot_apikey)}`;

    const resp = await fetch(callUrl);
    const body = await resp.text();
    console.log(`CallMeBot → ${substitute}: ${resp.status} ${body.slice(0, 80)}`);

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
