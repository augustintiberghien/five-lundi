import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import webpush from "npm:web-push";
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
    const { substitute, absentPlayer, sessionDate } = await req.json();

    if (!substitute || !absentPlayer) {
      return new Response(JSON.stringify({ error: "missing fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    webpush.setVapidDetails(
      "mailto:contact@five-lundi.app",
      Deno.env.get("VAPID_PUBLIC_KEY")!,
      Deno.env.get("VAPID_PRIVATE_KEY")!
    );

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data } = await supabase
      .from("push_subscriptions")
      .select("subscription")
      .eq("name", substitute)
      .maybeSingle();

    if (!data?.subscription) {
      console.log(`No push subscription for ${substitute}`);
      return new Response(JSON.stringify({ ok: true, notified: false, reason: "no_subscription" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await webpush.sendNotification(
      data.subscription,
      JSON.stringify({
        title: "Five Lundi 🟢",
        body: `${absentPlayer} est absent · Tu joues le ${sessionDate} !`,
      })
    );

    console.log(`Push sent to ${substitute}`);
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
