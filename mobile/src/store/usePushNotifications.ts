import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { navigationRef } from '../navigation/navigationRef';
import { supabase } from '../lib/supabase';
import { Session } from '../types/session';
import { useAuth } from './AuthContext';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowList: true,
  }),
});

export function usePushNotifications() {
  const { user } = useAuth();
  const receivedSub = useRef<Notifications.EventSubscription | null>(null);
  const responseSub = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    if (!user) return;

    registerAndSaveToken(user.id);

    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'Locker Room',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
      });
    }

    receivedSub.current = Notifications.addNotificationReceivedListener(() => {
      // foreground : bannière automatique
    });

    responseSub.current = Notifications.addNotificationResponseReceivedListener(response => {
      const sessionId = response.notification.request.content.data?.sessionId as string | undefined;
      if (sessionId && navigationRef.isReady()) {
        navigationRef.navigate('SessionDetail', { sessionId });
      }
    });

    return () => {
      receivedSub.current?.remove();
      responseSub.current?.remove();
    };
  }, [user]);
}

async function registerAndSaveToken(userId: string): Promise<void> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') return;
  if (!Device.isDevice) return;

  try {
    const { data: tokenData } = await Notifications.getExpoPushTokenAsync();
    await supabase.from('push_tokens').upsert(
      { user_id: userId, token: tokenData.data, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    );
  } catch {
    // Expo Go / EAS non configuré : token indisponible, notifs locales OK
  }
}

// ─── Notifs locales ────────────────────────────────────────────────────────────

export async function scheduleSessionReminder(session: Session): Promise<void> {
  const sessionDate = new Date(session.dateISO + 'T00:00:00');
  const reminderDate = new Date(sessionDate);
  reminderDate.setDate(reminderDate.getDate() - 3);
  reminderDate.setHours(18, 0, 0, 0);

  if (reminderDate <= new Date()) return;

  await Notifications.cancelScheduledNotificationAsync(`reminder-${session.id}`).catch(() => {});
  await Notifications.scheduleNotificationAsync({
    identifier: `reminder-${session.id}`,
    content: {
      title: 'Locker Room ⚽',
      body: `Tu joues ${session.date.split(' ')[1]} prochain ? Confirme ta présence !`,
      data: { sessionId: session.id },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: reminderDate,
    },
  });
}

export async function cancelSessionReminder(sessionId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(`reminder-${sessionId}`).catch(() => {});
}
