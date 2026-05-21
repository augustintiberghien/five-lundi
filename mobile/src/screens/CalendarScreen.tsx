import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useRef, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SessionCard from '../components/SessionCard';
import { useT } from '../i18n';
import { RootStackParamList } from '../navigation/RootNavigator';
import { supabase } from '../lib/supabase';
import { useProfile } from '../store/ProfileContext';
import { useSessions } from '../store/SessionsContext';
import { isPast, UserRegistration } from '../types/session';

type Nav = NativeStackNavigationProp<RootStackParamList>;

type RegRow = { session_id: string; status: string; bench_position?: number };

export default function CalendarScreen() {
  const navigation = useNavigation<Nav>();
  const t = useT();
  const { sessions } = useSessions();
  const { profile } = useProfile();
  const [registrations, setRegistrations] = useState<Record<string, UserRegistration>>({});
  const listRef = useRef<FlatList>(null);

  const playerName = profile?.name ?? '';
  const nextIndex = sessions.findIndex(s => !isPast(s));

  // Load registrations from Supabase for this player
  useEffect(() => {
    if (!playerName) return;
    supabase
      .from('registrations')
      .select('session_id, status, bench_position')
      .eq('player_name', playerName)
      .then(({ data }) => {
        if (!data) return;
        const map: Record<string, UserRegistration> = {};
        for (const row of data as RegRow[]) {
          map[row.session_id] = {
            status: row.status as UserRegistration['status'],
            benchPosition: row.bench_position,
          };
        }
        setRegistrations(map);
      });
  }, [playerName]);

  async function handleRegister(sessionId: string) {
    const session = sessions.find(s => s.id === sessionId)!;
    const isFull = session.confirmedCount >= session.maxPlayers;
    const newReg: UserRegistration = isFull
      ? { status: 'bench', benchPosition: session.benchCount + 1 }
      : { status: 'confirmed' };

    setRegistrations(prev => ({ ...prev, [sessionId]: newReg }));

    await supabase.from('registrations').upsert({
      session_id: sessionId,
      player_name: playerName,
      status: newReg.status,
      bench_position: newReg.benchPosition ?? null,
    }, { onConflict: 'session_id,player_name' });
  }

  async function handleUnregister(sessionId: string) {
    setRegistrations(prev => ({ ...prev, [sessionId]: { status: 'absent' } }));
    await supabase.from('registrations').upsert({
      session_id: sessionId,
      player_name: playerName,
      status: 'absent',
      bench_position: null,
    }, { onConflict: 'session_id,player_name' });
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t.tabs.calendar}</Text>
      </View>
      <FlatList
        ref={listRef}
        data={sessions}
        keyExtractor={s => s.id}
        contentContainerStyle={styles.list}
        initialScrollIndex={nextIndex >= 0 ? nextIndex : 0}
        getItemLayout={(_, index) => ({
          length: 130,
          offset: 130 * index,
          index,
        })}
        renderItem={({ item: session }) => {
          const reg: UserRegistration = registrations[session.id] ?? { status: 'none' };
          return (
            <SessionCard
              session={session}
              registration={reg}
              onRegister={() => handleRegister(session.id)}
              onUnregister={() => handleUnregister(session.id)}
              onPress={isPast(session) ? () => navigation.navigate('SessionDetail', { sessionId: session.id }) : undefined}
              onVote={session.voteOpen ? () => navigation.navigate('MVP', { sessionId: session.id }) : undefined}
            />
          );
        }}
        ListEmptyComponent={
          <Text style={styles.empty}>{t.session.noSessions}</Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d1117' },
  header: { paddingHorizontal: 16, paddingVertical: 12 },
  title: { fontSize: 22, fontWeight: '800', color: '#fff' },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  empty: { color: '#555', textAlign: 'center', marginTop: 40 },
});
