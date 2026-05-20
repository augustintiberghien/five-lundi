import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useT } from '../i18n';
import { RootStackParamList } from '../navigation/RootNavigator';
import { FORM_COLOR, PAIR_STATS, PLAYER_STATS } from '../types/stats';
import { isPast, SESSIONS } from '../types/session';

type Props = NativeStackScreenProps<RootStackParamList, 'Player'>;

export default function PlayerDetailScreen({ route, navigation }: Props) {
  const { playerName } = route.params;
  const t = useT();

  const player = PLAYER_STATS.find(p => p.name === playerName);
  if (!player) return null;

  const wr = Math.round((player.wins / player.played) * 100);
  const formColor = FORM_COLOR[player.form];

  // Best pairs: find all pairs involving this player, sort by win rate desc
  const pairs = PAIR_STATS
    .filter(p => (p.p1 === playerName || p.p2 === playerName) && p.together >= 2)
    .map(p => ({
      partner: p.p1 === playerName ? p.p2 : p.p1,
      together: p.together,
      wins: p.wins,
      wr: p.wins / p.together,
    }))
    .sort((a, b) => b.wr - a.wr || b.together - a.together)
    .slice(0, 5);

  // MVP sessions
  const mvpSessions = SESSIONS.filter(s => isPast(s) && s.mvp === playerName);

  // Current streak
  const streak = player.recentResults.length > 0
    ? player.recentResults.findIndex(r => r !== player.recentResults[0])
    : 0;
  const streakCount = streak === -1 ? player.recentResults.length : streak;
  const streakType = player.recentResults[0];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Profile hero */}
        <View style={styles.hero}>
          <View style={[styles.avatar, { borderColor: formColor }]}>
            <Text style={[styles.avatarText, { color: formColor }]}>
              {playerName.slice(0, 2).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.name}>{playerName}</Text>
          <Text style={[styles.formBadge, { color: formColor }]}>{t.form[player.form]}</Text>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <StatTile label={t.player.played}  value={String(player.played)} />
          <StatTile label={t.player.wins}    value={String(player.wins)} />
          <StatTile label={t.player.winrate} value={`${wr}%`} accent />
          {streakCount >= 2 && (
            <StatTile
              label={t.player.streak}
              value={`${streakType === 'W' ? '🔥' : '❄️'}${streakCount}`}
              accent={streakType === 'W'}
            />
          )}
        </View>

        {/* Recent form */}
        {player.recentResults.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t.player.recentForm}</Text>
            <View style={styles.dotsRow}>
              {player.recentResults.map((r, i) => (
                <View key={i} style={[styles.dot, r === 'W' ? styles.dotW : styles.dotL]}>
                  <Text style={styles.dotText}>{r}</Text>
                </View>
              ))}
              {player.recentResults.length < 5 && (
                <Text style={styles.moreDataHint}>{t.player.noRecentData}</Text>
              )}
            </View>
          </View>
        )}

        {/* Best pairs */}
        {pairs.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t.player.bestPairs}</Text>
            <View style={styles.pairsList}>
              {pairs.map(pair => {
                const pairWr = Math.round(pair.wr * 100);
                const maxWr = pairs[0].wr;
                return (
                  <TouchableOpacity
                    key={pair.partner}
                    style={styles.pairRow}
                    onPress={() => navigation.replace('Player', { playerName: pair.partner })}
                  >
                    <View style={styles.pairAvatars}>
                      <View style={styles.pairAvatarSmall}>
                        <Text style={styles.pairAvatarText}>
                          {playerName.slice(0, 2).toUpperCase()}
                        </Text>
                      </View>
                      <View style={[styles.pairAvatarSmall, styles.pairAvatarOverlap]}>
                        <Text style={styles.pairAvatarText}>
                          {pair.partner.slice(0, 2).toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.pairInfo}>
                      <View style={styles.pairNameRow}>
                        <Text style={styles.pairName}>{pair.partner}</Text>
                        <Text style={styles.pairWr}>{pairWr}%</Text>
                      </View>
                      <View style={styles.pairBarTrack}>
                        <View style={[styles.pairBarFill, { width: `${(pair.wr / maxWr) * 100}%` as any }]} />
                      </View>
                      <Text style={styles.pairCount}>
                        {pair.wins}/{pair.together} · {pair.together} {t.player.together}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* MVP history */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.player.mvpHistory}</Text>
          {mvpSessions.length === 0 ? (
            <Text style={styles.noMvp}>{t.player.noMvp}</Text>
          ) : (
            <View style={styles.mvpList}>
              {mvpSessions.map(s => {
                const [scoreA, scoreB] = s.score.split('–').map(x => x.trim());
                const winnerName = s.scoreWinner === 'A' ? s.nameA : s.nameB;
                return (
                  <TouchableOpacity
                    key={s.id}
                    style={styles.mvpRow}
                    onPress={() => navigation.navigate('SessionDetail', { sessionId: s.id })}
                  >
                    <Text style={styles.mvpTrophy}>🏆</Text>
                    <View style={styles.mvpInfo}>
                      <Text style={styles.mvpDate}>{t.formatDate(s.date)}</Text>
                      <Text style={styles.mvpScore}>
                        {s.nameA} {scoreA} – {scoreB} {s.nameB} · {winnerName}
                      </Text>
                    </View>
                    <Text style={styles.mvpArrow}>→</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

function StatTile({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <View style={styles.statTile}>
      <Text style={[styles.statValue, accent && styles.statAccent]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  backBtn: { width: 40 },
  backArrow: { fontSize: 22, color: '#fff' },

  scroll: { paddingHorizontal: 20, paddingBottom: 40 },

  // Hero
  hero: { alignItems: 'center', paddingTop: 8, paddingBottom: 24 },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#0d0d0d', borderWidth: 2.5,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  avatarText: { fontSize: 26, fontWeight: '900' },
  name: { fontSize: 26, fontWeight: '900', color: '#fff', marginBottom: 6 },
  formBadge: { fontSize: 13, fontWeight: '700' },

  // Stats
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#111', borderRadius: 14,
    borderWidth: 1, borderColor: '#1e1e1e',
    marginBottom: 24, overflow: 'hidden',
  },
  statTile: {
    flex: 1, alignItems: 'center', paddingVertical: 16,
    borderRightWidth: 1, borderRightColor: '#1e1e1e',
  },
  statValue: { fontSize: 20, fontWeight: '900', color: '#fff', marginBottom: 3 },
  statAccent: { color: '#4CAF50' },
  statLabel: { fontSize: 9, color: '#444', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },

  // Sections
  section: { marginBottom: 28 },
  sectionTitle: {
    fontSize: 10, fontWeight: '800', color: '#333',
    letterSpacing: 1.5, marginBottom: 12,
  },

  // Recent form dots
  dotsRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  dotW: { backgroundColor: 'rgba(76,175,80,0.2)', borderWidth: 1, borderColor: '#4CAF50' },
  dotL: { backgroundColor: 'rgba(244,67,54,0.12)', borderWidth: 1, borderColor: '#F44336' },
  dotText: { fontSize: 11, fontWeight: '800', color: '#fff' },
  moreDataHint: { fontSize: 10, color: '#2a2a2a', flex: 1, marginLeft: 4 },

  // Pairs
  pairsList: { gap: 10 },
  pairRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pairAvatars: { flexDirection: 'row' },
  pairAvatarSmall: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#1a1a1a', borderWidth: 1.5, borderColor: '#2a2a2a',
    alignItems: 'center', justifyContent: 'center',
  },
  pairAvatarOverlap: { marginLeft: -10 },
  pairAvatarText: { fontSize: 9, fontWeight: '800', color: '#666' },
  pairInfo: { flex: 1 },
  pairNameRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  pairName: { fontSize: 13, fontWeight: '700', color: '#ddd' },
  pairWr: { fontSize: 12, fontWeight: '700', color: '#4CAF50' },
  pairBarTrack: { height: 3, backgroundColor: '#1a1a1a', borderRadius: 2, overflow: 'hidden', marginBottom: 3 },
  pairBarFill: { height: '100%', backgroundColor: '#2e5c2e', borderRadius: 2 },
  pairCount: { fontSize: 10, color: '#333' },

  // MVP
  mvpList: { gap: 2 },
  mvpRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#111',
  },
  mvpTrophy: { fontSize: 22 },
  mvpInfo: { flex: 1 },
  mvpDate: { fontSize: 13, fontWeight: '700', color: '#f5c518', marginBottom: 2, textTransform: 'capitalize' },
  mvpScore: { fontSize: 10, color: '#444' },
  mvpArrow: { fontSize: 14, color: '#2a2a2a' },
  noMvp: { fontSize: 12, color: '#2a2a2a' },
});
