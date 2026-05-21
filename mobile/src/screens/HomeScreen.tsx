import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMemo } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useT } from '../i18n';
import { RootStackParamList } from '../navigation/RootNavigator';
import { FORM_COLOR, PLAYER_STATS } from '../types/stats';
import { useSessions } from '../store/SessionsContext';
import { useProfile } from '../store/ProfileContext';
import { isPast } from '../types/session';
import { getInitials } from '../utils/formatting';

type Nav = NativeStackNavigationProp<RootStackParamList>;

function extractArticleTitle(article: string): string {
  const match = article.match(/^\*\*(.+?)\*\*/);
  return match ? match[1] : '';
}

function computeStats(sessions: ReturnType<typeof useSessions>['sessions'], name: string) {
  const played = sessions.filter(s =>
    isPast(s) && s.players?.some(p => p.name === name)
  );
  let wins = 0;
  const recentResults: ('W' | 'L')[] = [];
  for (const s of played) {
    const p = s.players!.find(p => p.name === name)!;
    const won = (p.team === 'A' && s.scoreWinner === 'A') || (p.team === 'B' && s.scoreWinner === 'B');
    if (won) wins++;
    recentResults.push(won ? 'W' : 'L');
  }
  const lastMvp = sessions.find(s => s.mvp === name);
  return {
    played: played.length,
    wins,
    winRate: played.length > 0 ? Math.round((wins / played.length) * 100) : 0,
    recentResults: recentResults.slice(0, 5),
    lastMvpDate: lastMvp?.date,
  };
}

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const t = useT();
  const { profile, openProfile } = useProfile();
  const { sessions } = useSessions();

  const displayName = profile?.name ?? '';
  const initials = getInitials(displayName);

  const stats = useMemo(() => computeStats(sessions, displayName), [sessions, displayName]);

  const streak = stats.recentResults.length > 0
    ? stats.recentResults.findIndex(r => r !== stats.recentResults[0])
    : 0;
  const streakCount = streak === -1 ? stats.recentResults.length : streak;
  const streakType = stats.recentResults[0] ?? 'L';

  const nextSession = sessions.find(s => !isPast(s));
  const voteSession = sessions.find(s => s.voteOpen);
  const lastArticleSession = sessions.find(s => s.article);
  const lastPlayedSession = sessions.find(s => isPast(s) && s.players && s.players.length > 0);

  const sessionPlayers = lastPlayedSession?.players ?? [];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ─── Profil ─── */}
        <View style={styles.profileSection}>
          <TouchableOpacity onPress={openProfile} activeOpacity={0.8}>
            {profile?.photoUri ? (
              <Image source={{ uri: profile.photoUri }} style={styles.avatarImg} />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
            )}
          </TouchableOpacity>
          <Text style={styles.userName}>{displayName}</Text>
          <Text style={styles.userSub}>Five du Lundi</Text>
          {profile?.bio ? (
            <Text style={styles.userBio} numberOfLines={2}>{profile.bio}</Text>
          ) : null}
          {stats.lastMvpDate && (
            <View style={styles.mvpBadge}>
              <Text style={styles.mvpBadgeText}>🏆 MVP · {stats.lastMvpDate}</Text>
            </View>
          )}
          <TouchableOpacity
            style={styles.coachBtn}
            onPress={() => navigation.navigate('Coach')}
          >
            <Text style={styles.coachBtnText}>⚙ {t.coach.title}</Text>
          </TouchableOpacity>
        </View>

        {/* ─── Stats snapshot ─── */}
        <View style={styles.statsRow}>
          <StatTile label={t.player.played} value={String(stats.played)} />
          <StatTile label={t.player.wins} value={String(stats.wins)} />
          <StatTile label={t.player.winrate} value={`${stats.winRate}%`} />
          {stats.recentResults.length >= 2 && (
            <StatTile
              label={t.player.streak}
              value={`${streakType === 'W' ? '🔥' : '❄️'}${streakCount}`}
              accent={streakType === 'W'}
            />
          )}
        </View>

        {/* ─── Forme des 5 derniers ─── */}
        {stats.recentResults.length > 0 && (
          <View style={styles.recentRow}>
            <Text style={styles.recentLabel}>{t.home.registered}</Text>
            <View style={styles.resultDots}>
              {stats.recentResults.map((r, i) => (
                <View key={i} style={[styles.dot, r === 'W' ? styles.dotW : styles.dotL]}>
                  <Text style={styles.dotText}>{r}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

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
                const s = PLAYER_STATS.find(s => s.name === p.name);
                const color = s ? FORM_COLOR[s.form] : '#555';
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
                  <Text style={styles.voteAlertTitle}>{t.formatDate(voteSession.date)}</Text>
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
              <Text style={styles.nextMatchDate}>{t.formatDate(nextSession.date)}</Text>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },

  profileSection: { alignItems: 'center', paddingTop: 28, paddingBottom: 24 },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#1a3a1a', borderWidth: 2, borderColor: '#4CAF50',
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  avatarImg: { width: 72, height: 72, borderRadius: 36, marginBottom: 12 },
  avatarText: { fontSize: 24, fontWeight: '900', color: '#4CAF50' },
  userName: { fontSize: 22, fontWeight: '900', color: '#fff', marginBottom: 4 },
  userSub: { fontSize: 12, color: '#555', marginBottom: 6 },
  userBio: { fontSize: 12, color: '#444', textAlign: 'center', maxWidth: 240, marginBottom: 10, lineHeight: 17 },
  mvpBadge: {
    backgroundColor: 'rgba(245,197,24,0.1)', borderWidth: 1,
    borderColor: 'rgba(245,197,24,0.3)', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 4,
  },
  mvpBadgeText: { fontSize: 11, fontWeight: '700', color: '#f5c518' },
  coachBtn: {
    marginTop: 12, backgroundColor: '#111', borderRadius: 20,
    borderWidth: 1, borderColor: '#1e1e1e', paddingHorizontal: 14, paddingVertical: 6,
  },
  coachBtnText: { fontSize: 11, color: '#444', fontWeight: '700' },

  statsRow: {
    flexDirection: 'row', backgroundColor: '#111', borderRadius: 14,
    borderWidth: 1, borderColor: '#1e1e1e', marginBottom: 10, overflow: 'hidden',
  },
  statTile: {
    flex: 1, alignItems: 'center', paddingVertical: 16,
    borderRightWidth: 1, borderRightColor: '#1e1e1e',
  },
  statValue: { fontSize: 18, fontWeight: '900', color: '#fff', marginBottom: 3 },
  statValueAccent: { color: '#FF9800' },
  statLabel: { fontSize: 9, color: '#444', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },

  recentRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 28, paddingHorizontal: 2,
  },
  recentLabel: { fontSize: 10, color: '#333', fontWeight: '700', textTransform: 'uppercase' },
  resultDots: { flexDirection: 'row', gap: 6 },
  dot: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  dotW: { backgroundColor: 'rgba(76,175,80,0.2)', borderWidth: 1, borderColor: '#4CAF50' },
  dotL: { backgroundColor: 'rgba(244,67,54,0.15)', borderWidth: 1, borderColor: '#F44336' },
  dotText: { fontSize: 9, fontWeight: '800', color: '#fff' },

  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  sectionTitle: { fontSize: 10, fontWeight: '800', color: '#333', letterSpacing: 1.5 },
  sectionLine: { flex: 1, height: 1, backgroundColor: '#1a1a1a' },
  seeAll: { fontSize: 11, color: '#555', fontWeight: '600' },

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

  voteAlert: {
    backgroundColor: 'rgba(255,152,0,0.07)', borderWidth: 1,
    borderColor: 'rgba(255,152,0,0.25)', borderRadius: 12, padding: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  voteAlertLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  voteAlertIcon: { fontSize: 22 },
  voteAlertTitle: { fontSize: 13, fontWeight: '700', color: '#FF9800', marginBottom: 2, textTransform: 'capitalize' },
  voteAlertSub: { fontSize: 11, color: '#664400' },
  voteAlertArrow: { fontSize: 16, color: '#FF9800' },

  nextMatchCard: {
    backgroundColor: '#111', borderRadius: 14, borderWidth: 1, borderColor: '#1e1e1e', padding: 16,
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

  articleCard: {
    backgroundColor: '#111', borderRadius: 14, borderWidth: 1, borderColor: '#1e1e1e', padding: 16,
  },
  articleMasthead: { fontSize: 9, color: '#333', fontWeight: '700', letterSpacing: 1.5, marginBottom: 8 },
  articleTitle: { fontSize: 17, fontWeight: '900', color: '#fff', marginBottom: 6, lineHeight: 22 },
  articleMvp: { fontSize: 11, color: '#f5c518', marginBottom: 12 },
  articleReadMore: { fontSize: 12, color: '#4CAF50', fontWeight: '700' },
});
