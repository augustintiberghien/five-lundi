import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useT } from '../i18n';
import { RootStackParamList } from '../navigation/RootNavigator';
import { SessionPlayer, SESSIONS } from '../types/session';

type Props = NativeStackScreenProps<RootStackParamList, 'MVP'>;

export default function MVPScreen({ route, navigation }: Props) {
  const { sessionId } = route.params;
  const session = SESSIONS.find(s => s.id === sessionId)!;

  const t = useT();
  const [selected, setSelected] = useState<string | null>(null);
  const [voted, setVoted] = useState(false);

  const players = session.players ?? [];
  const teamA = players.filter(p => p.team === 'A');
  const teamB = players.filter(p => p.team === 'B');

  function handleVote() {
    if (!selected) return;
    setVoted(true);
    // TODO: persist to Supabase
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t.session.voteTitle}</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {voted ? (
          <VotedConfirmation name={selected!} onBack={() => navigation.goBack()} />
        ) : (
          <>
            <Text style={styles.sessionDate}>{t.session.mondayPrefix} {session.date}</Text>
            <Text style={styles.question}>{t.session.voteQuestion}</Text>

            <TeamSection
              label={session.nameA}
              players={teamA}
              selected={selected}
              onSelect={setSelected}
            />
            <TeamSection
              label={session.nameB}
              players={teamB}
              selected={selected}
              onSelect={setSelected}
            />

            <TouchableOpacity
              style={[styles.voteBtn, !selected && styles.voteBtnDisabled]}
              onPress={handleVote}
              disabled={!selected}
            >
              <Text style={[styles.voteBtnText, !selected && styles.voteBtnTextDisabled]}>
                {selected ? t.session.voteConfirmBtn(selected) : t.session.voteSelectPrompt}
              </Text>
            </TouchableOpacity>

            <Text style={styles.closingNote}>{t.session.voteClosed}</Text>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function TeamSection({
  label,
  players,
  selected,
  onSelect,
}: {
  label: string;
  players: SessionPlayer[];
  selected: string | null;
  onSelect: (name: string) => void;
}) {
  if (players.length === 0) return null;
  const isTeamA = players[0].team === 'A';

  return (
    <View style={styles.teamSection}>
      <Text style={[styles.teamLabel, isTeamA ? styles.teamAColor : styles.teamBColor]}>
        {label}
      </Text>
      <View style={styles.playerGrid}>
        {players.map(p => (
          <PlayerCard
            key={p.name}
            player={p}
            isSelected={selected === p.name}
            onPress={() => onSelect(p.name)}
          />
        ))}
      </View>
    </View>
  );
}

function PlayerCard({
  player,
  isSelected,
  onPress,
}: {
  player: SessionPlayer;
  isSelected: boolean;
  onPress: () => void;
}) {
  const initials = player.name
    .split(' ')
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('')
    .slice(0, 2);

  const isA = player.team === 'A';

  return (
    <TouchableOpacity style={styles.playerCard} onPress={onPress} activeOpacity={0.75}>
      <View style={[
        styles.playerCircle,
        isA ? styles.circleA : styles.circleB,
        isSelected && styles.circleSelected,
      ]}>
        {isSelected ? (
          <Text style={styles.checkmark}>✓</Text>
        ) : (
          <Text style={[styles.initials, !isA && styles.initialsLight]}>{initials}</Text>
        )}
      </View>
      <Text style={[styles.playerName, isSelected && styles.playerNameSelected]} numberOfLines={1}>
        {player.name}
      </Text>
    </TouchableOpacity>
  );
}

function VotedConfirmation({ name, onBack }: { name: string; onBack: () => void }) {
  const t = useT();
  return (
    <View style={styles.confirmation}>
      <View style={styles.confirmIcon}>
        <Text style={styles.confirmCheck}>✓</Text>
      </View>
      <Text style={styles.confirmTitle}>{t.session.votedTitle}</Text>
      <Text style={styles.confirmName}>{name}</Text>
      <Text style={styles.confirmSub}>{t.session.votedSub}</Text>
      <TouchableOpacity style={styles.backBtn2} onPress={onBack}>
        <Text style={styles.backBtn2Text}>{t.session.back}</Text>
      </TouchableOpacity>
    </View>
  );
}

const CIRCLE = 56;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  backBtn: { width: 40 },
  backArrow: { fontSize: 22, color: '#fff' },
  headerTitle: { fontSize: 15, fontWeight: '800', color: '#fff' },

  scroll: { paddingHorizontal: 20, paddingBottom: 40 },

  sessionDate: { fontSize: 12, color: '#444', marginTop: 24, marginBottom: 4, textTransform: 'capitalize' },
  question: { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 28, lineHeight: 26 },

  teamSection: { marginBottom: 24 },
  teamLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 12, textTransform: 'uppercase' },
  teamAColor: { color: '#aaa' },
  teamBColor: { color: '#64B5F6' },

  playerGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },

  playerCard: { alignItems: 'center', width: (CIRCLE + 16) },

  playerCircle: {
    width: CIRCLE,
    height: CIRCLE,
    borderRadius: CIRCLE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    marginBottom: 6,
  },
  circleA: { backgroundColor: '#f5f5f5', borderColor: '#ccc' },
  circleB: { backgroundColor: '#1565C0', borderColor: '#0D47A1' },
  circleSelected: { borderColor: '#4CAF50', borderWidth: 2.5 },
  initials: { fontSize: 16, fontWeight: '800', color: '#1a1a1a' },
  initialsLight: { color: '#fff' },
  checkmark: { fontSize: 22, color: '#4CAF50', fontWeight: '900' },

  playerName: { fontSize: 11, fontWeight: '600', color: '#666', textAlign: 'center' },
  playerNameSelected: { color: '#4CAF50' },

  voteBtn: {
    backgroundColor: '#4CAF50',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  voteBtnDisabled: { backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#2a2a2a' },
  voteBtnText: { fontSize: 15, fontWeight: '800', color: '#fff' },
  voteBtnTextDisabled: { color: '#333' },

  closingNote: { fontSize: 11, color: '#333', textAlign: 'center' },

  confirmation: { alignItems: 'center', paddingTop: 60, gap: 12 },
  confirmIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(76,175,80,0.15)',
    borderWidth: 2,
    borderColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  confirmCheck: { fontSize: 32, color: '#4CAF50' },
  confirmTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  confirmName: { fontSize: 22, fontWeight: '900', color: '#4CAF50' },
  confirmSub: { fontSize: 13, color: '#555', textAlign: 'center', lineHeight: 20, marginTop: 4 },
  backBtn2: {
    marginTop: 32,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 10,
    paddingHorizontal: 28,
    paddingVertical: 12,
  },
  backBtn2Text: { fontSize: 13, color: '#555', fontWeight: '600' },
});
