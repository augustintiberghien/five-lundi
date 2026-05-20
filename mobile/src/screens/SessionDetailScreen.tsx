import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useRef, useState } from 'react';
import { Animated, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useT } from '../i18n';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useSessions } from '../store/SessionsContext';
import { GROUP_CONFIG, isPast } from '../types/session';

type Props = NativeStackScreenProps<RootStackParamList, 'SessionDetail'>;

export default function SessionDetailScreen({ route, navigation }: Props) {
  const { sessionId } = route.params;
  const { sessions } = useSessions();
  const session = sessions.find(s => s.id === sessionId)!;
  const t = useT();
  const past = isPast(session);

  const [scoreA, scoreB] = past
    ? session.score.split('–').map(s => s.trim())
    : ['—', '—'];

  const aWon = session.scoreWinner === 'A';
  const bWon = session.scoreWinner === 'B';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerDate}>{t.formatDate(session.date)}</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Time + location */}
        {(() => {
          const time = session.time ?? GROUP_CONFIG.defaultTime;
          const loc  = session.location ?? GROUP_CONFIG.defaultLocation;
          if (!time && !loc) return null;
          return (
            <View style={styles.metaRow}>
              {time ? <Text style={styles.metaItem}>🕐 {time}</Text> : null}
              {loc  ? <Text style={styles.metaItem}>📍 {loc}</Text>  : null}
            </View>
          );
        })()}

        {/* Score block */}
        <View style={styles.scoreBlock}>
          <View style={styles.teamCol}>
            <Text style={[styles.teamName, aWon && styles.winner]}>{session.nameA}</Text>
            <Text style={[styles.scoreNum, aWon && styles.winner]}>{scoreA}</Text>
          </View>
          <Text style={styles.scoreSep}>–</Text>
          <View style={[styles.teamCol, styles.teamColRight]}>
            <Text style={[styles.teamName, bWon && styles.winner]}>{session.nameB}</Text>
            <Text style={[styles.scoreNum, bWon && styles.winner]}>{scoreB}</Text>
          </View>
        </View>

        {/* Action buttons */}
        {(session.voteOpen || session.compo) && (
          <View style={styles.actionsRow}>
            {session.voteOpen && (
              <TouchableOpacity
                style={[styles.actionBtn, styles.actionBtnVote]}
                onPress={() => navigation.navigate('MVP', { sessionId })}
              >
                <Text style={styles.actionBtnVoteText}>{t.session.voteMvp}</Text>
              </TouchableOpacity>
            )}
            {session.compo && (
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => navigation.navigate('Compo', { sessionId })}
              >
                <Text style={styles.actionBtnText}>{t.session.seeLineup}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* MVP */}
        {session.mvp && (
          <View style={styles.mvpRow}>
            <Text style={styles.mvpLabel}>{t.session.mvp}</Text>
            <Text style={styles.mvpName}>{session.mvp}</Text>
          </View>
        )}

        {/* Article */}
        {session.article ? (
          <ArticleSection text={session.article} shareLabel={t.session.shareArticle} />
        ) : past ? (
          <View style={styles.articlePending}>
            <Text style={styles.pendingIcon}>📰</Text>
            <Text style={styles.pendingText}>{t.session.articlePending}</Text>
            <Text style={styles.pendingSubtext}>{t.session.articlePendingSub}</Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function ArticleSection({ text, shareLabel }: { text: string; shareLabel: string }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, [fadeAnim]);

  const paragraphs = text.split('\n\n').filter(Boolean);

  return (
    <Animated.View style={[styles.articleContainer, { opacity: fadeAnim }]}>
      <View style={styles.articleDivider} />
      <Text style={styles.articleMasthead}>L'ÉQUIPE — FIVE LUNDI</Text>

      {paragraphs.map((para, i) => {
        if (para.startsWith('**') && para.endsWith('**') && para.indexOf('**', 2) === para.length - 2) {
          // Section heading: **TEXT**
          const heading = para.slice(2, -2);
          return <Text key={i} style={styles.articleHeading}>{heading}</Text>;
        }
        // Inline bold rendering: split on **...**
        return <RichText key={i} text={para} style={styles.articleBody} />;
      })}

      <TouchableOpacity style={styles.shareBtn}>
        <Text style={styles.shareBtnText}>{shareLabel}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

function RichText({ text, style }: { text: string; style: object }) {
  const parts: { text: string; bold: boolean }[] = [];
  const regex = /\*\*(.+?)\*\*/g;
  let last = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push({ text: text.slice(last, match.index), bold: false });
    parts.push({ text: match[1], bold: true });
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push({ text: text.slice(last), bold: false });

  return (
    <Text style={style}>
      {parts.map((p, i) => (
        <Text key={i} style={p.bold ? styles.bold : undefined}>{p.text}</Text>
      ))}
    </Text>
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
  headerDate: { fontSize: 14, fontWeight: '700', color: '#888', textTransform: 'capitalize' },

  scroll: { paddingHorizontal: 20, paddingBottom: 40 },

  metaRow: {
    flexDirection: 'row', gap: 20,
    paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#111',
  },
  metaItem: { fontSize: 12, color: '#555', fontWeight: '500' },

  scoreBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    gap: 16,
  },
  teamCol: { alignItems: 'center', flex: 1 },
  teamColRight: { alignItems: 'center' },
  teamName: { fontSize: 13, color: '#555', fontWeight: '600', marginBottom: 8, textAlign: 'center' },
  scoreNum: { fontSize: 52, fontWeight: '900', color: '#333', lineHeight: 56 },
  winner: { color: '#fff' },
  scoreSep: { fontSize: 32, color: '#333', fontWeight: '300' },

  actionsRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  actionBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  actionBtnVote: {
    backgroundColor: 'rgba(255,152,0,0.1)',
    borderColor: '#FF9800',
  },
  actionBtnVoteText: { fontSize: 13, fontWeight: '700', color: '#FF9800' },
  actionBtnText: { fontSize: 13, fontWeight: '600', color: '#555' },

  mvpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(245, 197, 24, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(245, 197, 24, 0.2)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 8,
  },
  mvpLabel: { fontSize: 12, color: '#f5c518', fontWeight: '700' },
  mvpName: { fontSize: 15, color: '#fff', fontWeight: '800' },

  articleContainer: { marginTop: 16 },
  articleDivider: { height: 1, backgroundColor: '#1e1e1e', marginBottom: 16 },
  articleMasthead: {
    fontSize: 10,
    color: '#333',
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 20,
    textAlign: 'center',
  },
  articleHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: '#555',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 20,
    marginBottom: 6,
  },
  articleBody: {
    fontSize: 15,
    color: '#ccc',
    lineHeight: 24,
    marginBottom: 4,
  },
  bold: { fontWeight: '700', color: '#fff' },

  shareBtn: {
    marginTop: 28,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  shareBtnText: { fontSize: 13, color: '#555', fontWeight: '600' },

  articlePending: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  pendingIcon: { fontSize: 32 },
  pendingText: { fontSize: 14, color: '#555', fontWeight: '600' },
  pendingSubtext: { fontSize: 12, color: '#333' },
});
