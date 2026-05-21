import { supabase } from '../lib/supabase';

type NotifType = 'vote_open' | 'compo_published' | 'presence_reminder';

export async function sendPushNotification(
  type: NotifType,
  sessionId: string
): Promise<void> {
  try {
    await supabase.functions.invoke('send-push', {
      body: { type, sessionId },
    });
  } catch {
    // non-bloquant — la notif est du best-effort
  }
}
