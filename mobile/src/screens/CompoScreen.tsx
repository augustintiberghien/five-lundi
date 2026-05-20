import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PitchField from '../components/PitchField';
import PlayerToken from '../components/PlayerToken';
import { RootStackParamList } from '../navigation/RootNavigator';
import {
  DEFAULT_ASSIGNMENT,
  DEFAULT_BENCH,
  FieldPos,
  POSITIONS,
} from '../types/compo';
import { SESSIONS } from '../types/session';

type Props = NativeStackScreenProps<RootStackParamList, 'Compo'>;

const FIELD_H_RATIO = 1.45;
const SNAP_THRESHOLD = 55;

export default function CompoScreen({ route, navigation }: Props) {
  const { sessionId } = route.params;
  const session = SESSIONS.find(s => s.id === sessionId);

  const { width: screenWidth } = useWindowDimensions();
  const fieldWidth = screenWidth - 32;
  const fieldHeight = Math.round(fieldWidth * FIELD_H_RATIO);

  const initialAssignment = session?.compo ?? DEFAULT_ASSIGNMENT;
  const [assignment, setAssignment] = useState<Record<string, string>>(initialAssignment);

  const benchNames = session?.players
    ? [] // bench would come from session registration data later
    : DEFAULT_BENCH;

  function toAbsPx(pos: FieldPos) {
    return {
      cx: (pos.x / 100) * fieldWidth,
      cy: (pos.y / 100) * fieldHeight,
    };
  }

  function handleDrop(posId: string, dx: number, dy: number) {
    const src = POSITIONS.find(p => p.id === posId)!;
    const { cx, cy } = toAbsPx(src);
    const dropX = cx + dx;
    const dropY = cy + dy;

    let nearest: FieldPos | null = null;
    let minDist = SNAP_THRESHOLD;

    for (const p of POSITIONS) {
      const { cx: px, cy: py } = toAbsPx(p);
      const dist = Math.sqrt((px - dropX) ** 2 + (py - dropY) ** 2);
      if (dist < minDist && p.id !== posId) {
        minDist = dist;
        nearest = p;
      }
    }

    if (nearest) {
      setAssignment(prev => ({
        ...prev,
        [posId]: prev[nearest!.id],
        [nearest!.id]: prev[posId],
      }));
    }
  }

  const nameA = session?.nameA ?? 'Blanche ⚪';
  const nameB = session?.nameB ?? 'Bleue 🔵';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {session ? `Compo · ${session.date}` : 'Composition'}
        </Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} bounces={false}>
        {/* Team labels */}
        <View style={styles.teamsRow}>
          <View style={styles.teamBadge}>
            <Text style={[styles.teamLabel, styles.teamAText]}>{nameA}</Text>
          </View>
          <Text style={styles.vs}>vs</Text>
          <View style={styles.teamBadge}>
            <Text style={[styles.teamLabel, styles.teamBText]}>{nameB}</Text>
          </View>
        </View>

        {/* Field */}
        <View style={styles.fieldWrapper}>
          <PitchField width={fieldWidth} height={fieldHeight}>
            {POSITIONS.map(pos => {
              const { cx, cy } = toAbsPx(pos);
              return (
                <PlayerToken
                  key={pos.id}
                  name={assignment[pos.id] ?? '?'}
                  team={pos.team}
                  cx={cx}
                  cy={cy}
                  onDrop={(dx, dy) => handleDrop(pos.id, dx, dy)}
                />
              );
            })}
          </PitchField>
        </View>

        {/* Bench */}
        {benchNames.length > 0 && (
          <View style={styles.benchSection}>
            <Text style={styles.benchTitle}>Banc</Text>
            <View style={styles.benchRow}>
              {benchNames.map(name => (
                <View key={name} style={styles.benchToken}>
                  <Text style={styles.benchName}>{name}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

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
  headerTitle: { fontSize: 14, fontWeight: '700', color: '#888' },

  scroll: { paddingHorizontal: 16, paddingBottom: 24 },

  teamsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  teamBadge: { flex: 1 },
  teamLabel: { fontSize: 13, fontWeight: '700', textAlign: 'center' },
  teamAText: { color: '#f0f0f0' },
  teamBText: { color: '#64B5F6' },
  vs: { color: '#555', fontSize: 12, marginHorizontal: 8 },

  fieldWrapper: { borderRadius: 8, overflow: 'hidden' },

  benchSection: { marginTop: 16 },
  benchTitle: {
    color: '#666', fontSize: 11, fontWeight: '600',
    marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1,
  },
  benchRow: { flexDirection: 'row', gap: 10 },
  benchToken: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  benchName: { color: '#aaa', fontSize: 13, fontWeight: '600' },
});
