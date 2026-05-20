import { useRef, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SessionCard from '../components/SessionCard';
import { isPast, MOCK_USER_REGISTRATIONS, SESSIONS, UserRegistration } from '../types/session';

export default function CalendarScreen() {
  const [registrations, setRegistrations] = useState(MOCK_USER_REGISTRATIONS);
  const listRef = useRef<FlatList>(null);

  const nextIndex = SESSIONS.findIndex(s => !isPast(s));

  function handleRegister(sessionId: string) {
    const session = SESSIONS.find(s => s.id === sessionId)!;
    const isFull = session.confirmedCount >= session.maxPlayers;
    setRegistrations(prev => ({
      ...prev,
      [sessionId]: isFull
        ? { status: 'bench', benchPosition: session.benchCount + 1 }
        : { status: 'confirmed' },
    }));
  }

  function handleUnregister(sessionId: string) {
    setRegistrations(prev => ({
      ...prev,
      [sessionId]: { status: 'absent' },
    }));
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Calendrier</Text>
      </View>
      <FlatList
        ref={listRef}
        data={SESSIONS}
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
            />
          );
        }}
        ListEmptyComponent={
          <Text style={styles.empty}>Aucune session</Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: { paddingHorizontal: 16, paddingVertical: 12 },
  title: { fontSize: 22, fontWeight: '800', color: '#fff' },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  empty: { color: '#555', textAlign: 'center', marginTop: 40 },
});
