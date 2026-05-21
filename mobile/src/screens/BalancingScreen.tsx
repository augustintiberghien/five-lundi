import { useNavigation } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Position } from '../store/useOnboarding';
import { usePlayerRatings } from '../store/usePlayerRatings';
import { balanceTeams, teamStrength } from '../utils/balancing';

const POSITIONS: Position[] = ['GK', 'DEF', 'MIL', 'ATT'];
const POS_ICON: Record<Position, string> = { GK: '🧤', DEF: '🛡️', MIL: '🔄', ATT: '⚡' };

type Phase = 'select' | 'result';

export default function BalancingScreen() {
  const navigation = useNavigation();
  const { ratings, positions: storedPositions, saveRatings } = usePlayerRatings();
  const players = Object.keys(ratings);

  const [positions, setPositions] = useState<Record<string, Position>>(storedPositions);
  const [selected, setSelected] = useState<Set<string>>(new Set(players));
  const [phase, setPhase] = useState<Phase>('select');
  const [teams, setTeams] = useState<{ teamA: string[]; teamB: string[] } | null>(null);
  const [swapFirst, setSwapFirst] = useState<string | null>(null);

  // Sync positions when remote data loads
  useEffect(() => {
    setPositions(storedPositions);
  // JSON.stringify used for deep comparison — avoids re-running on every render when object reference changes but content stays the same
  }, [JSON.stringify(storedPositions)]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync selected when players change
  useEffect(() => {
    setSelected(prev => {
      const next = new Set(prev);
      players.forEach(p => next.add(p));
      return next;
    });
  // players.length used intentionally — we only need to add new players, not react to position changes here
  }, [players.length]); // eslint-disable-line react-hooks/exhaustive-deps

  function togglePlayer(name: string) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  }

  function cyclePosition(name: string) {
    const cur = positions[name];
    const idx = cur ? POSITIONS.indexOf(cur) : -1;
    const next = POSITIONS[(idx + 1) % POSITIONS.length];
    const updated = { ...positions, [name]: next };
    setPositions(updated);
    saveRatings(ratings, updated); // persist + sync to Supabase
  }

  function generate() {
    const sel = players.filter(p => selected.has(p));
    const result = balanceTeams(sel, ratings, positions);
    setTeams(result);
    setPhase('result');
    setSwapFirst(null);
  }

  function handleSwapTap(name: string) {
    if (!swapFirst) {
      setSwapFirst(name);
      return;
    }
    if (swapFirst === name) {
      setSwapFirst(null);
      return;
    }
    // Swap between teams
    setTeams(prev => {
      if (!prev) return prev;
      const inA = prev.teamA.includes(swapFirst);
      const tapInA = prev.teamA.includes(name);
      if (inA === tapInA) { setSwapFirst(null); return prev; } // same team → cancel
      const newA = prev.teamA.map(p => (p === swapFirst ? name : p === name ? swapFirst : p));
      const newB = prev.teamB.map(p => (p === swapFirst ? name : p === name ? swapFirst : p));
      return { teamA: newA, teamB: newB };
    });
    setSwapFirst(null);
  }

  const selectedCount = players.filter(p => selected.has(p)).length;
  const teamSize = Math.floor(selectedCount / 2);

  // ── Select phase ──────────────────────────────────────────────────
  if (phase === 'select') {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.headerBtnText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Équilibrage</Text>
          <View style={styles.headerBtn} />
        </View>

        <Text style={styles.hint}>
          Sélectionne les joueurs · touche la position pour la modifier
        </Text>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {players.length === 0 && (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyIcon}>📊</Text>
              <Text style={styles.emptyText}>Aucun joueur noté</Text>
              <Text style={styles.emptySub}>Note les joueurs depuis l'onglet Notation d'abord.</Text>
            </View>
          )}
          {players.map(name => {
            const isSelected = selected.has(name);
            const pos = positions[name];
            return (
              <TouchableOpacity
                key={name}
                style={[styles.playerRow, !isSelected && styles.playerRowDim]}
                onPress={() => togglePlayer(name)}
                activeOpacity={0.7}
              >
                <View style={[styles.check, isSelected && styles.checkOn]}>
                  {isSelected && <Text style={styles.checkMark}>✓</Text>}
                </View>
                <Text style={[styles.playerName, !isSelected && styles.playerNameDim]}>{name}</Text>
                <TouchableOpacity
                  style={[styles.posPill, pos && styles.posPillOn]}
                  onPress={() => cyclePosition(name)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.posPillText}>
                    {pos ? `${POS_ICON[pos]} ${pos}` : '＋ Pos'}
                  </Text>
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.genBtn, selectedCount < 2 && styles.genBtnDisabled]}
            disabled={selectedCount < 2}
            onPress={generate}
          >
            <Text style={styles.genBtnText}>
              {selectedCount < 2
                ? 'Sélectionne au moins 2 joueurs'
                : `Générer ${teamSize} vs ${selectedCount - teamSize}  →`}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Result phase ──────────────────────────────────────────────────
  if (!teams) return null;

  const strA = teamStrength(teams.teamA, ratings);
  const strB = teamStrength(teams.teamB, ratings);
  const diff = Math.abs(strA - strB).toFixed(1);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => { setPhase('select'); setSwapFirst(null); }}>
          <Text style={styles.headerBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Équilibrage</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Balance indicator */}
        <View style={styles.balanceRow}>
          <View style={styles.balanceBadge}>
            <Text style={styles.balanceLabel}>Écart moyen</Text>
            <Text style={styles.balanceValue}>{diff} pts</Text>
          </View>
          {swapFirst ? (
            <Text style={styles.swapHint}>Touche un joueur de l'autre équipe</Text>
          ) : (
            <Text style={styles.swapHint}>Touche 2 joueurs pour les échanger</Text>
          )}
        </View>

        {/* Team A */}
        <TeamCard
          label="Équipe ⚪"
          players={teams.teamA}
          ratings={ratings}
          positions={positions}
          swapFirst={swapFirst}
          onTap={handleSwapTap}
          color="#fff"
        />

        {/* Team B */}
        <TeamCard
          label="Équipe 🔵"
          players={teams.teamB}
          ratings={ratings}
          positions={positions}
          swapFirst={swapFirst}
          onTap={handleSwapTap}
          color="#64B5F6"
        />

        <TouchableOpacity style={styles.regenBtn} onPress={generate}>
          <Text style={styles.regenBtnText}>↺  Régénérer</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

// ─── TeamCard ─────────────────────────────────────────────────────

function TeamCard({
  label, players, ratings, positions, swapFirst, onTap, color,
}: {
  label: string;
  players: string[];
  ratings: ReturnType<typeof usePlayerRatings>['ratings'];
  positions: Record<string, Position>;
  swapFirst: string | null;
  onTap: (name: string) => void;
  color: string;
}) {
  return (
    <View style={styles.teamCard}>
      <Text style={[styles.teamLabel, { color }]}>{label}</Text>
      {players.map(name => {
        const pos = positions[name];
        const isSwapping = swapFirst === name;
        return (
          <TouchableOpacity
            key={name}
            style={[styles.teamRow, isSwapping && styles.teamRowSwapping]}
            onPress={() => onTap(name)}
            activeOpacity={0.7}
          >
            {pos && (
              <Text style={styles.teamPos}>{POS_ICON[pos]}</Text>
            )}
            <Text style={[styles.teamName, isSwapping && { color: '#FF9800' }]}>{name}</Text>
            <Text style={styles.teamScore}>
              {avgStr(name, ratings)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function avgStr(name: string, ratings: ReturnType<typeof usePlayerRatings>['ratings']): string {
  const r = ratings[name];
  if (!r) return '12.0';
  const keys = ['endurance','vitesse','technique','vision','physique','leadership'] as const;
  const avg = keys.reduce((s, k) => s + r[k], 0) / keys.length;
  return avg.toFixed(1);
}

// ─── Styles ───────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d1117' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#1a1a1a',
  },
  headerBtn:     { width: 40 },
  headerBtnText: { fontSize: 22, color: '#fff' },
  headerTitle:   { fontSize: 15, fontWeight: '800', color: '#fff' },

  hint: { fontSize: 11, color: '#333', textAlign: 'center', paddingVertical: 10 },

  scroll: { paddingHorizontal: 20, paddingBottom: 32 },

  // Empty state
  emptyBox: { alignItems: 'center', paddingVertical: 60, gap: 10 },
  emptyIcon: { fontSize: 40 },
  emptyText: { fontSize: 16, fontWeight: '700', color: '#555' },
  emptySub:  { fontSize: 12, color: '#333', textAlign: 'center' },

  // Player rows (select phase)
  playerRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: '#111827',
  },
  playerRowDim: { opacity: 0.4 },
  check: {
    width: 22, height: 22, borderRadius: 6,
    borderWidth: 1.5, borderColor: '#333',
    alignItems: 'center', justifyContent: 'center',
  },
  checkOn: { backgroundColor: '#FFD600', borderColor: '#FFD600' },
  checkMark: { fontSize: 12, color: '#fff', fontWeight: '900' },
  playerName: { flex: 1, fontSize: 14, fontWeight: '700', color: '#ddd' },
  playerNameDim: { color: '#555' },

  posPill: {
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 8, borderWidth: 1, borderColor: '#252525',
    backgroundColor: '#111827',
  },
  posPillOn: { borderColor: '#444', backgroundColor: '#1a1a1a' },
  posPillText: { fontSize: 11, fontWeight: '700', color: '#888' },

  // Footer (select phase)
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: '#1a1a1a' },
  genBtn: {
    backgroundColor: '#FFD600', borderRadius: 12,
    paddingVertical: 15, alignItems: 'center',
  },
  genBtnDisabled: { backgroundColor: '#1a2a1a' },
  genBtnText: { fontSize: 14, fontWeight: '800', color: '#fff' },

  // Result phase
  balanceRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 16,
  },
  balanceBadge: {
    backgroundColor: '#0d1a0d', borderRadius: 10, borderWidth: 1,
    borderColor: '#FFD600', paddingHorizontal: 12, paddingVertical: 6, gap: 2,
  },
  balanceLabel: { fontSize: 9, fontWeight: '700', color: '#FFD600', letterSpacing: 1 },
  balanceValue: { fontSize: 18, fontWeight: '900', color: '#fff' },
  swapHint: { flex: 1, fontSize: 11, color: '#444', textAlign: 'right', marginLeft: 12 },

  teamCard: {
    backgroundColor: '#111827', borderRadius: 14,
    borderWidth: 1, borderColor: '#1e2a3a',
    padding: 16, marginBottom: 16,
  },
  teamLabel: { fontSize: 13, fontWeight: '900', marginBottom: 12 },
  teamRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: '#0e0e0e',
  },
  teamRowSwapping: { backgroundColor: 'rgba(255,152,0,0.08)', borderRadius: 8 },
  teamPos:  { fontSize: 16, width: 24, textAlign: 'center' },
  teamName: { flex: 1, fontSize: 14, fontWeight: '700', color: '#ddd' },
  teamScore: { fontSize: 13, fontWeight: '900', color: '#555' },

  regenBtn: {
    borderRadius: 12, borderWidth: 1.5, borderColor: '#2a2a2a',
    paddingVertical: 13, alignItems: 'center', marginTop: 4,
  },
  regenBtnText: { fontSize: 13, fontWeight: '700', color: '#555' },
});
