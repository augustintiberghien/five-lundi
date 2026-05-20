import { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PitchField from '../components/PitchField';
import PlayerToken from '../components/PlayerToken';
import {
  DEFAULT_ASSIGNMENT,
  DEFAULT_BENCH,
  FieldPos,
  POSITIONS,
} from '../types/compo';

const FIELD_H_RATIO = 1.45; // fieldHeight = fieldWidth * ratio
const SNAP_THRESHOLD = 55;   // px — max distance to snap to a position

export default function CompoScreen() {
  const { width: screenWidth } = useWindowDimensions();
  const fieldWidth = screenWidth - 32;
  const fieldHeight = Math.round(fieldWidth * FIELD_H_RATIO);

  const [assignment, setAssignment] = useState<Record<string, string>>(DEFAULT_ASSIGNMENT);

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

  const teamALabel = 'Blanche ⚪';
  const teamBLabel = 'Bleue 🔵';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} bounces={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.teamBadge}>
            <Text style={[styles.teamLabel, styles.teamAText]}>{teamALabel}</Text>
          </View>
          <Text style={styles.vs}>vs</Text>
          <View style={styles.teamBadge}>
            <Text style={[styles.teamLabel, styles.teamBText]}>{teamBLabel}</Text>
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
        <View style={styles.benchSection}>
          <Text style={styles.benchTitle}>Banc</Text>
          <View style={styles.benchRow}>
            {DEFAULT_BENCH.map(name => (
              <View key={name} style={styles.benchToken}>
                <Text style={styles.benchName}>{name}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  scroll: { paddingHorizontal: 16, paddingBottom: 24 },

  header: {
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
  benchTitle: { color: '#666', fontSize: 11, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
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
