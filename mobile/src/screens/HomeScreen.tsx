import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useT } from '../i18n';
import { RootStackParamList } from '../navigation/RootNavigator';
import { FORM_COLOR, PLAYER_STATS } from '../types/stats';
import { isPast, MOCK_USER_REGISTRATIONS, SESSIONS } from '../types/session';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const MOCK_USER = {
  name: 'Michael',
  role: 'Gardien',
  groupName: 'Five du Lundi',
  lastMvpDate: undefined as string | undefined,
  stats: {
    played: 9,
    wins: 6,
    winRate: 67,
    recentResults: ['W', 'W', 'L', 'W', 'W'] as ('W' | 'L')[],
  },
};

function extractArticleTitle(article: string): string {
  const match = article.match(/^\*\*(.+?)\*\*/);
  return match ? match[1] : '';
}

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const t = useT();

  const nextSession = SESSIONS.find(s => !isPast(s));
  const voteSession = SESSIONS.find(s => s.voteOpen);
  const lastArticleSession = SESSIONS.find(s => s.article);
  const lastPlayedSession = SESSIONS.find(s => isPast(s) && s.players && s.players.length > 0);

  const nextReg = nextSession ? (MOCK_USER_REGISTRATIONS[nextSession.id] ?? { status: 'none' }) : null;

  const streak = MOCK_USER.stats.recentResults.findIndex(r => r !== MOCK_USER.stats.recentResults[0]);
  const streakCount = streak === -1 ? MOCK_USER.stats.recentResults.length : streak;
  const streakType = MOCK_USER.stats.recentResults[0];

  const sessionPlayers = lastPlayedSession?.players ?? [];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ─── Profil ─── */}
        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {MOCK_USER.name.slice(0, 2).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.userName}>{MOCK_USER.name}</Text>
          <Text style={styles.userSub}>{MOCK_USER.groupName} · {MOCK_USER.role}</Text>
          {MOCK_USER.lastMvpDate && (
            <View style={styles.mvpBadge}>
              <Text style={styles.mvpBadgeText}>🏆 MVP · {MOCK_USER.lastMvpDate}</Text>
            </View>
          )}
        </View>

        {/* ─── Stats snapshot ─── */}
        <View style={styles.statsRow}>
          <StatTile label={t.player.played} value={String(MOCK_USER.stats.played)} />
          <StatTile label={t.player.wins} value={String(MOCK_USER.stats.wins)} />
          <StatTile label={t.player.winrate} value={`${MOCK_USER.stats.winRate}%`} />
          <StatTile
            label={t.player.streak}
            value={`${streakType === 'W' ? '🔥' : '❄️'}${streakCount}`}
            accent={streakType === 'W'}
          />
        </View>

        {/* ─── Forme des 5 derniers ─── */}
        <View style={styles.recentRow}>
          <Text style={styles.recentLabel}>{t.home.registered}</Text>
          <View style={styles.resultDots}>
            {MOCK_USER.stats.recentResults.map((r, i) => (
              <View key={i} style={[styles.dot, r === 'W' ? styles.dotW : styles.dotL]}>
                <Text style={styles.dotText}>{r}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ─── L'équipe ─── */}
        {sessionPlayers.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t.home.team}</Text>
              <View style={styles.sectionLine} />
              <TouchableOpacity onPress={() => navigation.navigate('Players')}>
                <Text style={styles.seeAll}>{t.home.seeAll}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.teamAvatarRow}>
              {sessionPlayers.slice(0, 8).map((p, i) => {
                const stats = PLAYER_STATS.find(s => s.name === p.name);
                const color = stats ? FORM_COLOR[stats.form] : '#555';
                return (
                  <TouchableOpacity
                    key={p.name}
                    style={[styles.teamAvatar, i > 0 && styles.teamAvatarOverlap]}
                    onPress={() => navigation.navigate('Player', { playerName: p.name })}
                  >
                    <View style={[styles.teamAvatarCircle, { borderColor: color }]}>
                      <Text style={[styles.teamAvatarText, { color }]}>
                        {p.name.slice(0, 2).toUpperCase()}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
              {sessionPlayers.length > 8 && (
                <View style={[styles.teamAvatar, styles.teamAvatarOverlap]}>
                  <View style={styles.teamAvatarMore}>
                    <Text style={styles.teamAvatarMoreText}>+{sessionPlayers.length - 8}</Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        )}

        {/* ─── Vote en cours ─── */}
        {voteSession && (
          <View style={styles.section}>
            <SectionHeader title={t.home.voteInProgress} />
            <TouchableOpacity
              style={styles.voteAlert}
              onPress={() => navigation.navigate('MVP', { sessionId: voteSession.id })}
            >
              <View style={styles.voteAlertLeft}>
                <Text style={styles.voteAlertIcon}>⚡</Text>
                <View>
                  <Text style={styles.voteAlertTitle}>
                    {t.formatDate(voteSession.date)}
                  </Text>
                  <Text style={styles.voteAlertSub}>{t.home.notVotedYet}</Text>
                </View>
              </View>
              <Text style={styles.voteAlertArrow}>→</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ─── Prochain match ─── */}
        {nextSession && (
          <View style={styles.section}>
            <SectionHeader title={t.home.nextMatch} />
            <TouchableOpacity
              style={styles.nextMatchCard}
              onPress={() => navigation.navigate('SessionDetail', { sessionId: nextSession.id })}
            >
              <Text style={styles.nextMatchDate}>
                {t.formatDate(nextSession.date)}
              </Text>
              <View style={styles.nextMatchTeams}>
                <Text style={styles.nextTeamA}>{nextSession.nameA}</Text>
                <Text style={styles.nextVs}>vs</Text>
                <Text style={styles.nextTeamB}>{nextSession.nameB}</Text>
              </View>

              <View style={styles.nextMatchFooter}>
                <View style={styles.countBubble}>
                  <View style={[styles.countDot, nextSession.inscriptionsOpen && styles.countDotOpen]} />
                  <Text style={styles.countText}>
                    {nextSession.confirmedCount}/{nextSession.maxPlayers} {t.session.inscribed}
                  </Text>
                </View>
                <RegistrationBadge status={nextReg?.status ?? 'none'} t={t} />
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* ─── Dernière édition ─── */}
        {lastArticleSession?.article && (
          <View style={styles.section}>
            <SectionHeader title={t.home.lastEdition} />
            <TouchableOpacity
              style={styles.articleCard}
              onPress={() => navigation.navigate('SessionDetail', { sessionId: lastArticleSession.id })}
            >
              <Text style={styles.articleMasthead}>
                L'ÉQUIPE · {lastArticleSession.date}
              </Text>
              <Text style={styles.articleTitle}>
                {extractArticleTitle(lastArticleSession.article)}
              </Text>
              {lastArticleSession.mvp && (
                <Text style={styles.articleMvp}>{t.session.mvp} : {lastArticleSession.mvp}</Text>
              )}
              <Text style={styles.articleReadMore}>{t.home.readArticle}</Text>
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionLine} />
    </View>
  );
}

function StatTile({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <View style={styles.statTile}>
      <Text style={[styles.statValue, accent && styles.statValueAccent]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

type T = ReturnType<typeof useT>;

function RegistrationBadge({ status, t }: { status: string; t: T }) {
  if (status === 'confirmed') {
    return (
      <View style={[styles.regBadge, styles.regBadgeGreen]}>
        <Text style={styles.regBadgeText}>{t.session.confirmed}</Text>
      </View>
    );
  }
  if (status === 'bench') {
    return (
      <View style={[styles.regBadge, styles.regBadgeAmber]}>
        <Text style={styles.regBadgeText}>{t.session.bench}</Text>
      </View>
    );
  }
  if (status === 'absent') {
    return (
      <View style={[styles.regBadge, styles.regBadgeGrey]}>
        <Text style={styles.regBadgeText}>{t.session.absent}</Text>
      </View>
    );
  }
  return (
    <View style={[styles.regBadge, styles.regBadgeGrey]}>
      <Text style={styles.regBadgeText}>{t.session.notRegistered}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },

  // ── Profil
  profileSection: { alignItems: 'center', paddingTop: 28, paddingBottom: 24 },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#1a3a1a',
    borderWidth: 2, borderColor: '#4CAF50',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: { fontSize: 24, fontWeight: '900', color: '#4CAF50' },
  userName: { fontSize: 22, fontWeight: '900', color: '#fff', marginBottom: 4 },
  userSub: { fontSize: 12, color: '#555', marginBottom: 10 },
  mvpBadge: {
    backgroundColor: 'rgba(245,197,24,0.1)',
    borderWidth: 1, borderColor: 'rgba(245,197,24,0.3)',
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4,
  },
  mvpBadgeText: { fontSize: 11, fontWeight: '700', color: '#f5c518' },

  // ── Stats
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#111',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1e1e1e',
    marginBottom: 10,
    overflow: 'hidden',
  },
  statTile: {
    flex: 1, alignItems: 'center',
    paddingVertical: 16,
    borderRightWidth: 1, borderRightColor: '#1e1e1e',
  },
  statValue: { fontSize: 18, fontWeight: '900', color: '#fff', marginBottom: 3 },
  statValueAccent: { color: '#FF9800' },
  statLabel: { fontSize: 9, color: '#444', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },

  // ── Forme
  recentRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginBottom: 28, paddingHorizontal: 2,
  },
  recentLabel: { fontSize: 10, color: '#333', fontWeight: '700', textTransform: 'uppercase' },
  resultDots: { flexDirection: 'row', gap: 6 },
  dot: {
    width: 24, height: 24, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  dotW: { backgroundColor: 'rgba(76,175,80,0.2)', borderWidth: 1, borderColor: '#4CAF50' },
  dotL: { backgroundColor: 'rgba(244,67,54,0.15)', borderWidth: 1, borderColor: '#F44336' },
  dotText: { fontSize: 9, fontWeight: '800', color: '#fff' },

  // ── Sections
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  sectionTitle: { fontSize: 10, fontWeight: '800', color: '#333', letterSpacing: 1.5 },
  sectionLine: { flex: 1, height: 1, backgroundColor: '#1a1a1a' },
  seeAll: { fontSize: 11, color: '#555', fontWeight: '600' },

  // ── L'équipe avatars
  teamAvatarRow: { flexDirection: 'row', alignItems: 'center', paddingLeft: 2 },
  teamAvatar: {},
  teamAvatarOverlap: { marginLeft: -12 },
  teamAvatarCircle: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#0d0d0d', borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  teamAvatarText: { fontSize: 11, fontWeight: '800' },
  teamAvatarMore: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#1a1a1a', borderWidth: 2, borderColor: '#2a2a2a',
    alignItems: 'center', justifyContent: 'center',
  },
  teamAvatarMoreText: { fontSize: 10, fontWeight: '700', color: '#555' },

  // ── Vote alert
  voteAlert: {
    backgroundColor: 'rgba(255,152,0,0.07)',
    borderWidth: 1, borderColor: 'rgba(255,152,0,0.25)',
    borderRadius: 12, padding: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  voteAlertLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  voteAlertIcon: { fontSize: 22 },
  voteAlertTitle: { fontSize: 13, fontWeight: '700', color: '#FF9800', marginBottom: 2, textTransform: 'capitalize' },
  voteAlertSub: { fontSize: 11, color: '#664400' },
  voteAlertArrow: { fontSize: 16, color: '#FF9800' },

  // ── Prochain match
  nextMatchCard: {
    backgroundColor: '#111', borderRadius: 14,
    borderWidth: 1, borderColor: '#1e1e1e', padding: 16,
  },
  nextMatchDate: { fontSize: 11, color: '#444', fontWeight: '600', marginBottom: 10, textTransform: 'capitalize' },
  nextMatchTeams: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  nextTeamA: { flex: 1, fontSize: 14, fontWeight: '800', color: '#ddd' },
  nextVs: { fontSize: 11, color: '#333' },
  nextTeamB: { flex: 1, fontSize: 14, fontWeight: '800', color: '#64B5F6', textAlign: 'right' },
  nextMatchFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  countBubble: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  countDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#333' },
  countDotOpen: { backgroundColor: '#4CAF50' },
  countText: { fontSize: 11, color: '#444' },
  regBadge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1 },
  regBadgeGreen: { backgroundColor: 'rgba(76,175,80,0.15)', borderColor: '#4CAF50' },
  regBadgeAmber: { backgroundColor: 'rgba(255,160,0,0.12)', borderColor: '#FFA000' },
  regBadgeGrey: { backgroundColor: '#161616', borderColor: '#2a2a2a' },
  regBadgeText: { fontSize: 11, fontWeight: '700', color: '#eee' },

  // ── Article teaser
  articleCard: {
    backgroundColor: '#111', borderRadius: 14,
    borderWidth: 1, borderColor: '#1e1e1e', padding: 16,
  },
  articleMasthead: { fontSize: 9, color: '#333', fontWeight: '700', letterSpacing: 1.5, marginBottom: 8 },
  articleTitle: { fontSize: 17, fontWeight: '900', color: '#fff', marginBottom: 6, lineHeight: 22 },
  articleMvp: { fontSize: 11, color: '#f5c518', marginBottom: 12 },
  articleReadMore: { fontSize: 12, color: '#4CAF50', fontWeight: '700' },
});
