import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootStackParamList } from '../navigation/RootNavigator';
import {
  FORM_COLOR,
  PAIR_STATS,
  PLAYER_STATS,
  RANK_METHOD_LABELS,
  RankMethod,
  rankPlayers,
} from '../types/stats';
import { isPast, SESSIONS } from '../types/session';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Section = 'classement' | 'joueurs' | 'paires' | 'palmares';

const SECTIONS: { key: Section; label: string }[] = [
  { key: 'classement', label: 'Classement' },
  { key: 'joueurs',    label: 'Joueurs' },
  { key: 'paires',     label: 'Paires' },
  { key: 'palmares',   label: 'Palmarès' },
];

const METHODS: RankMethod[] = ['winrate', 'regularite', 'equilibre', 'stabilite'];

export default function StatsScreen() {
  const navigation = useNavigation<Nav>();
  const [section, setSection] = useState<Section>('classement');
  const [method, setMethod] = useState<RankMethod>('winrate');

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Stats</Text>
      </View>

      {/* Section selector */}
      <View style={styles.segmentRow}>
        {SECTIONS.map(s => (
          <TouchableOpacity
            key={s.key}
            style={[styles.segment, section === s.key && styles.segmentActive]}
            onPress={() => setSection(s.key)}
          >
            <Text style={[styles.segmentText, section === s.key && styles.segmentTextActive]}>
              {s.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {section === 'classement' && (
          <ClassementSection method={method} onMethodChange={setMethod} />
        )}
        {section === 'joueurs' && <JoueursSection />}
        {section === 'paires'   && <PairesSection />}
        {section === 'palmares' && <PalmaresSection navigation={navigation} />}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Classement ───────────────────────────────────────────────────

function ClassementSection({
  method,
  onMethodChange,
}: {
  method: RankMethod;
  onMethodChange: (m: RankMethod) => void;
}) {
  const ranked = rankPlayers(PLAYER_STATS, method);
  const maxScore = ranked[0]?.score ?? 1;

  return (
    <>
      {/* Method pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.methodRow}
      >
        {METHODS.map(m => (
          <TouchableOpacity
            key={m}
            style={[styles.methodPill, method === m && styles.methodPillActive]}
            onPress={() => onMethodChange(m)}
          >
            <Text style={[styles.methodText, method === m && styles.methodTextActive]}>
              {RANK_METHOD_LABELS[m]}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.rankList}>
        {ranked.map((player, i) => {
          const wr = Math.round((player.wins / player.played) * 100);
          const barWidth = maxScore > 0 ? (player.score / maxScore) * 100 : 0;
          const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null;

          return (
            <View key={player.name} style={styles.rankRow}>
              <Text style={[styles.rankPos, i < 3 && styles.rankPosPodium]}>
                {medal ?? `${i + 1}`}
              </Text>
              <View style={styles.rankInfo}>
                <View style={styles.rankNameRow}>
                  <Text style={styles.rankName}>{player.name}</Text>
                  <Text style={styles.rankWr}>{wr}%</Text>
                </View>
                <View style={styles.rankBar}>
                  <View style={[styles.rankBarFill, { width: `${barWidth}%` as any }]} />
                </View>
              </View>
              <Text style={styles.rankPlayed}>{player.played}m</Text>
            </View>
          );
        })}
      </View>

      <Text style={styles.methodNote}>{methodDescription(method)}</Text>
    </>
  );
}

function methodDescription(m: RankMethod): string {
  switch (m) {
    case 'winrate':    return 'Taux de victoires brut (min. 3 matchs)';
    case 'regularite': return 'Présence × performance — récompense ceux qui viennent ET gagnent';
    case 'equilibre':  return 'Winrate lissé — plus fiable avec peu de matchs';
    case 'stabilite':  return 'Winrate × ancienneté — confiance qui monte avec les matchs';
  }
}

// ─── Joueurs ──────────────────────────────────────────────────────

function JoueursSection() {
  return (
    <View style={styles.playerList}>
      {PLAYER_STATS.map(p => {
        const wr = Math.round((p.wins / p.played) * 100);
        const formColor = FORM_COLOR[p.form];

        return (
          <View key={p.name} style={styles.playerCard}>
            <View style={styles.playerCardLeft}>
              <View style={[styles.playerAvatar, { borderColor: formColor }]}>
                <Text style={[styles.playerInitials, { color: formColor }]}>
                  {p.name.slice(0, 2).toUpperCase()}
                </Text>
              </View>
              <View>
                <Text style={styles.playerName}>{p.name}</Text>
                <Text style={[styles.playerForm, { color: formColor }]}>{p.form}</Text>
              </View>
            </View>

            <View style={styles.playerCardRight}>
              {/* Stats */}
              <View style={styles.playerStatRow}>
                <MiniStat label="M" value={p.played} />
                <MiniStat label="V" value={p.wins} />
                <MiniStat label="%" value={wr} accent />
              </View>
              {/* Recent results */}
              <View style={styles.resultDots}>
                {p.recentResults.map((r, i) => (
                  <View key={i} style={[styles.resultDot, r === 'W' ? styles.dotW : styles.dotL]}>
                    <Text style={styles.resultDotText}>{r}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}

function MiniStat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <View style={styles.miniStat}>
      <Text style={[styles.miniStatVal, accent && styles.miniStatAccent]}>{value}</Text>
      <Text style={styles.miniStatLabel}>{label}</Text>
    </View>
  );
}

// ─── Paires ───────────────────────────────────────────────────────

function PairesSection() {
  const sorted = [...PAIR_STATS].sort((a, b) => {
    const wrA = a.wins / a.together;
    const wrB = b.wins / b.together;
    return wrB - wrA;
  });
  const maxWins = Math.max(...sorted.map(p => p.wins));

  return (
    <View style={styles.pairList}>
      <Text style={styles.pairNote}>
        Paires classées par taux de victoires ensemble (min. 5 matchs)
      </Text>
      {sorted.filter(p => p.together >= 4).map((pair, i) => {
        const wr = Math.round((pair.wins / pair.together) * 100);
        const barW = maxWins > 0 ? (pair.wins / maxWins) * 100 : 0;

        return (
          <View key={`${pair.p1}-${pair.p2}`} style={styles.pairRow}>
            <Text style={styles.pairRank}>{i + 1}</Text>
            <View style={styles.pairInfo}>
              <View style={styles.pairNames}>
                <Text style={styles.pairName}>{pair.p1}</Text>
                <Text style={styles.pairPlus}>+</Text>
                <Text style={styles.pairName}>{pair.p2}</Text>
                <Text style={styles.pairWr}>{wr}%</Text>
              </View>
              <View style={styles.pairBarRow}>
                <View style={styles.pairBar}>
                  <View style={[styles.pairBarFill, { width: `${barW}%` as any }]} />
                </View>
                <Text style={styles.pairCount}>{pair.wins}/{pair.together}</Text>
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}

// ─── Palmarès ─────────────────────────────────────────────────────

function PalmaresSection({ navigation }: { navigation: Nav }) {
  const mvpSessions = SESSIONS.filter(s => isPast(s) && s.mvp);
  const voteOpenSessions = SESSIONS.filter(s => isPast(s) && s.voteOpen && !s.mvp);

  // Tally MVP counts
  const tally: Record<string, number> = {};
  for (const s of mvpSessions) {
    tally[s.mvp!] = (tally[s.mvp!] ?? 0) + 1;
  }
  const topMvps = Object.entries(tally)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  return (
    <>
      {/* Top MVP summary */}
      {topMvps.length > 0 && (
        <View style={styles.hallHeader}>
          <Text style={styles.hallTitle}>🏆 Hall of Fame</Text>
          <View style={styles.hallPodium}>
            {topMvps.map(([name, count], i) => (
              <View key={name} style={styles.hallEntry}>
                <Text style={styles.hallMedal}>{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</Text>
                <Text style={styles.hallName}>{name}</Text>
                <Text style={styles.hallCount}>{count}×</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Chronological MVP list */}
      <View style={styles.mvpList}>
        {voteOpenSessions.map(s => (
          <TouchableOpacity
            key={s.id}
            style={styles.mvpRow}
            onPress={() => navigation.navigate('MVP', { sessionId: s.id })}
          >
            <View style={[styles.mvpCircle, styles.mvpCircleVote]}>
              <Text style={styles.mvpCircleText}>⚡</Text>
            </View>
            <View style={styles.mvpInfo}>
              <Text style={styles.mvpSessionDate}>Lundi {s.date}</Text>
              <Text style={styles.mvpScore}>{s.score} · {s.scoreWinner === 'A' ? s.nameA : s.nameB} gagne</Text>
            </View>
            <View style={styles.mvpVoteBadge}>
              <Text style={styles.mvpVoteBadgeText}>Voter →</Text>
            </View>
          </TouchableOpacity>
        ))}

        {mvpSessions.map((s, i) => {
          const [scoreA, scoreB] = s.score.split('–').map(x => x.trim());
          const winnerName = s.scoreWinner === 'A' ? s.nameA : s.nameB;

          return (
            <TouchableOpacity
              key={s.id}
              style={styles.mvpRow}
              onPress={() => navigation.navigate('SessionDetail', { sessionId: s.id })}
            >
              <View style={[styles.mvpCircle, i === 0 && styles.mvpCircleFirst]}>
                <Text style={styles.mvpCircleText}>🏆</Text>
              </View>
              <View style={styles.mvpInfo}>
                <Text style={styles.mvpName}>{s.mvp}</Text>
                <Text style={styles.mvpSessionDate}>Lundi {s.date}</Text>
                <Text style={styles.mvpScore}>
                  {s.nameA} {scoreA} – {scoreB} {s.nameB} · {winnerName} gagne
                </Text>
              </View>
              <Text style={styles.mvpArrow}>→</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: { paddingHorizontal: 20, paddingVertical: 12 },
  title: { fontSize: 22, fontWeight: '800', color: '#fff' },

  // Segment control
  segmentRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    backgroundColor: '#111',
    borderRadius: 10,
    padding: 3,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#1e1e1e',
  },
  segment: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  segmentActive: { backgroundColor: '#1e1e1e' },
  segmentText: { fontSize: 12, fontWeight: '600', color: '#444' },
  segmentTextActive: { color: '#fff' },

  scroll: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 40 },

  // Method pills
  methodRow: { gap: 8, paddingBottom: 16 },
  methodPill: {
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1, borderColor: '#222',
    backgroundColor: '#111',
  },
  methodPillActive: { backgroundColor: 'rgba(76,175,80,0.15)', borderColor: '#4CAF50' },
  methodText: { fontSize: 12, fontWeight: '600', color: '#444' },
  methodTextActive: { color: '#4CAF50' },

  // Rank list
  rankList: { gap: 2 },
  rankRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, gap: 10,
    borderBottomWidth: 1, borderBottomColor: '#111',
  },
  rankPos: { width: 28, fontSize: 12, color: '#444', fontWeight: '700', textAlign: 'center' },
  rankPosPodium: { fontSize: 16 },
  rankInfo: { flex: 1, gap: 5 },
  rankNameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rankName: { fontSize: 14, fontWeight: '700', color: '#ddd' },
  rankWr: { fontSize: 12, fontWeight: '700', color: '#4CAF50' },
  rankBar: { height: 3, backgroundColor: '#1a1a1a', borderRadius: 2, overflow: 'hidden' },
  rankBarFill: { height: '100%', backgroundColor: '#4CAF50', borderRadius: 2 },
  rankPlayed: { fontSize: 10, color: '#333', width: 24, textAlign: 'right' },
  methodNote: { fontSize: 10, color: '#333', marginTop: 16, lineHeight: 16 },

  // Player list
  playerList: { gap: 8 },
  playerCard: {
    backgroundColor: '#111',
    borderRadius: 12, borderWidth: 1, borderColor: '#1a1a1a',
    padding: 12, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'space-between',
  },
  playerCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  playerAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#0d0d0d', borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  playerInitials: { fontSize: 13, fontWeight: '800' },
  playerName: { fontSize: 14, fontWeight: '700', color: '#ddd', marginBottom: 2 },
  playerForm: { fontSize: 10, fontWeight: '600' },
  playerCardRight: { alignItems: 'flex-end', gap: 6 },
  playerStatRow: { flexDirection: 'row', gap: 12 },
  miniStat: { alignItems: 'center' },
  miniStatVal: { fontSize: 14, fontWeight: '800', color: '#ccc' },
  miniStatAccent: { color: '#4CAF50' },
  miniStatLabel: { fontSize: 8, color: '#444', fontWeight: '700', textTransform: 'uppercase' },
  resultDots: { flexDirection: 'row', gap: 4 },
  resultDot: {
    width: 18, height: 18, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
  },
  dotW: { backgroundColor: 'rgba(76,175,80,0.2)', borderWidth: 1, borderColor: '#4CAF50' },
  dotL: { backgroundColor: 'rgba(244,67,54,0.12)', borderWidth: 1, borderColor: '#F44336' },
  resultDotText: { fontSize: 7, fontWeight: '800', color: '#fff' },

  // Pair list
  pairList: { gap: 4 },
  pairNote: { fontSize: 10, color: '#333', marginBottom: 14, lineHeight: 16 },
  pairRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#111',
  },
  pairRank: { width: 20, fontSize: 12, color: '#444', fontWeight: '700', textAlign: 'center' },
  pairInfo: { flex: 1, gap: 5 },
  pairNames: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pairName: { fontSize: 13, fontWeight: '700', color: '#ddd' },
  pairPlus: { fontSize: 11, color: '#333' },
  pairWr: { marginLeft: 'auto', fontSize: 12, fontWeight: '700', color: '#4CAF50' },
  pairBarRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pairBar: { flex: 1, height: 3, backgroundColor: '#1a1a1a', borderRadius: 2, overflow: 'hidden' },
  pairBarFill: { height: '100%', backgroundColor: '#2e5c2e', borderRadius: 2 },
  pairCount: { fontSize: 10, color: '#333', width: 32, textAlign: 'right' },

  // Hall of Fame
  hallHeader: {
    backgroundColor: 'rgba(245,197,24,0.06)',
    borderWidth: 1, borderColor: 'rgba(245,197,24,0.15)',
    borderRadius: 12, padding: 16, marginBottom: 20,
  },
  hallTitle: { fontSize: 13, fontWeight: '800', color: '#f5c518', marginBottom: 12 },
  hallPodium: { flexDirection: 'row', gap: 16 },
  hallEntry: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  hallMedal: { fontSize: 18 },
  hallName: { fontSize: 13, fontWeight: '700', color: '#ddd' },
  hallCount: { fontSize: 11, color: '#555', fontWeight: '600' },

  mvpList: { gap: 2 },
  mvpRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#111',
  },
  mvpCircle: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#1a1a0a',
    borderWidth: 1, borderColor: 'rgba(245,197,24,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  mvpCircleFirst: {
    backgroundColor: 'rgba(245,197,24,0.12)',
    borderColor: 'rgba(245,197,24,0.4)',
  },
  mvpCircleVote: {
    backgroundColor: 'rgba(255,152,0,0.1)',
    borderColor: 'rgba(255,152,0,0.3)',
  },
  mvpCircleText: { fontSize: 18 },
  mvpInfo: { flex: 1, gap: 2 },
  mvpName: { fontSize: 15, fontWeight: '800', color: '#fff' },
  mvpSessionDate: { fontSize: 11, color: '#444', textTransform: 'capitalize' },
  mvpScore: { fontSize: 10, color: '#333' },
  mvpArrow: { fontSize: 14, color: '#2a2a2a' },
  mvpVoteBadge: {
    backgroundColor: 'rgba(255,152,0,0.12)',
    borderWidth: 1, borderColor: 'rgba(255,152,0,0.3)',
    borderRadius: 14, paddingHorizontal: 10, paddingVertical: 4,
  },
  mvpVoteBadgeText: { fontSize: 11, fontWeight: '700', color: '#FF9800' },
});
