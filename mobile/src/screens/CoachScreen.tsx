import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useT } from '../i18n';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useSessions } from '../store/SessionsContext';
import { GROUP_CONFIG, isPast } from '../types/session';
import { PLAYER_STATS } from '../types/stats';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function CoachScreen() {
  const navigation = useNavigation<Nav>();
  const t = useT();
  const { sessions, deleteSession } = useSessions();

  const nextSession = sessions.find(s => !isPast(s));
  const scoreSession = nextSession ?? sessions[0];

  const [inscOpen, setInscOpen]   = useState(nextSession?.inscriptionsOpen ?? false);
  const [scoreA, setScoreA]       = useState(0);
  const [scoreB, setScoreB]       = useState(0);
  const [confirmed, setConfirmed] = useState(false);
  const confirmScale = useRef(new Animated.Value(0)).current;

  function handleConfirm() {
    setConfirmed(true);
    Animated.spring(confirmScale, { toValue: 1, friction: 5, useNativeDriver: true }).start();
  }

  function handleDelete(sessionId: string, dateLabel: string) {
    Alert.alert(
      'Annuler la session ?',
      `La session du ${dateLabel} sera supprimée définitivement.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => deleteSession(sessionId),
        },
      ]
    );
  }

  const nextDefault = nextOccurrence(GROUP_CONFIG.defaultDayOfWeek);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t.coach.title}</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroCircle}>
            <Text style={styles.heroEmoji}>⚽</Text>
          </View>
          <Text style={styles.heroName}>{GROUP_CONFIG.name}</Text>
          <Text style={styles.heroSub}>
            {PLAYER_STATS.length} joueurs · {sessions.filter(isPast).length} sessions jouées
          </Text>
        </View>

        {/* Create session CTA */}
        <TouchableOpacity
          style={styles.createCard}
          onPress={() => navigation.navigate('CreateSession')}
          activeOpacity={0.75}
        >
          <View style={styles.createLeft}>
            <View style={styles.createIconCircle}>
              <Text style={styles.createIconText}>＋</Text>
            </View>
            <View>
              <Text style={styles.createTitle}>{t.coach.newSession}</Text>
              <Text style={styles.createSub}>
                {t.formatDate(nextDefault)} · {GROUP_CONFIG.defaultTime}
              </Text>
            </View>
          </View>
          <Text style={styles.createArrow}>→</Text>
        </TouchableOpacity>

        {/* Next session management */}
        {nextSession && (
          <>
            <Text style={styles.sectionLabel}>{t.coach.nextSession}</Text>
            <View style={styles.card}>
              {/* Date + delete button */}
              <View style={styles.cardHeader}>
                <Text style={styles.cardDate}>{t.formatDate(nextSession.date)}</Text>
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDelete(nextSession.id, nextSession.date)}
                >
                  <Text style={styles.deleteBtnText}>✕</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.cardMeta}>
                🕐 {nextSession.time ?? GROUP_CONFIG.defaultTime}
                {(nextSession.location ?? GROUP_CONFIG.defaultLocation)
                  ? `   ·   📍 ${nextSession.location ?? GROUP_CONFIG.defaultLocation}`
                  : ''}
              </Text>

              {/* Progress bar */}
              <View style={styles.progRow}>
                <Text style={styles.progLabel}>
                  {nextSession.confirmedCount}/{nextSession.maxPlayers} {t.coach.registered}
                </Text>
                {nextSession.benchCount > 0 && (
                  <Text style={styles.progBench}>+{nextSession.benchCount} {t.coach.bench}</Text>
                )}
              </View>
              <View style={styles.progTrack}>
                <View style={[styles.progFill, {
                  width: `${Math.min((nextSession.confirmedCount / nextSession.maxPlayers) * 100, 100)}%` as any,
                }]} />
              </View>

              {/* Action buttons */}
              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={[styles.actionBtn, inscOpen ? styles.actionClose : styles.actionOpen]}
                  onPress={() => setInscOpen(v => !v)}
                >
                  <Text style={styles.actionBtnText}>
                    {inscOpen ? t.coach.closeInsc : t.coach.openInsc}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.actionCompo]}
                  onPress={() => navigation.navigate('Compo', { sessionId: nextSession.id })}
                >
                  <Text style={styles.actionBtnText}>{t.coach.compo}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}

        {/* Score entry */}
        {scoreSession && (
          <>
            <Text style={styles.sectionLabel}>{t.coach.scoreSection}</Text>
            <View style={styles.card}>
              {confirmed ? (
                <Animated.View style={[styles.confirmedBox, { transform: [{ scale: confirmScale }] }]}>
                  <Text style={styles.confirmedCheck}>✓</Text>
                  <Text style={styles.confirmedTitle}>{t.coach.scoreRecorded}</Text>
                  <Text style={styles.confirmedSub}>
                    {scoreSession.nameA}  {scoreA} – {scoreB}  {scoreSession.nameB}
                  </Text>
                </Animated.View>
              ) : (
                <>
                  <View style={styles.scoreBoard}>
                    <ScoreCounter value={scoreA} onChange={setScoreA}
                      teamName={scoreSession.nameA} color="#fff" />
                    <Text style={styles.scoreDash}>–</Text>
                    <ScoreCounter value={scoreB} onChange={setScoreB}
                      teamName={scoreSession.nameB} color="#64B5F6" right />
                  </View>
                  <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
                    <Text style={styles.confirmBtnText}>{t.coach.confirmScore}</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────

function nextOccurrence(dayOfWeek: number): string {
  const d = new Date();
  const diff = (dayOfWeek - d.getDay() + 7) % 7 || 7;
  d.setDate(d.getDate() + diff);
  const months = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

// ─── ScoreCounter ─────────────────────────────────────────────────

function ScoreCounter({
  value, onChange, teamName, color, right,
}: {
  value: number; onChange: (v: number) => void;
  teamName: string; color: string; right?: boolean;
}) {
  const numScale = useRef(new Animated.Value(1)).current;
  const scaleM   = useRef(new Animated.Value(1)).current;
  const scaleP   = useRef(new Animated.Value(1)).current;

  function tap(btn: Animated.Value, delta: number) {
    Animated.sequence([
      Animated.timing(btn, { toValue: 0.75, duration: 65, useNativeDriver: true }),
      Animated.spring(btn, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();
    const next = value + delta;
    if (next < 0) return;
    onChange(next);
    Animated.sequence([
      Animated.timing(numScale, { toValue: 1.35, duration: 80, useNativeDriver: true }),
      Animated.spring(numScale, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();
  }

  return (
    <View style={[styles.counter, right && styles.counterRight]}>
      <Text
        style={[styles.counterTeam, { color, textAlign: right ? 'right' : 'left' }]}
        numberOfLines={1}
      >
        {teamName}
      </Text>
      <Animated.Text style={[styles.counterNum, { color, transform: [{ scale: numScale }] }]}>
        {value}
      </Animated.Text>
      <View style={[styles.counterBtns, right && styles.counterBtnsRight]}>
        <Pressable onPress={() => tap(scaleM, -1)}>
          <Animated.View style={[styles.cBtn, { transform: [{ scale: scaleM }] }]}>
            <Text style={styles.cBtnText}>−</Text>
          </Animated.View>
        </Pressable>
        <Pressable onPress={() => tap(scaleP, +1)}>
          <Animated.View style={[styles.cBtn, styles.cBtnPlus, { transform: [{ scale: scaleP }] }]}>
            <Text style={[styles.cBtnText, { color: '#fff' }]}>+</Text>
          </Animated.View>
        </Pressable>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#1a1a1a',
  },
  backBtn: { width: 40 },
  backArrow: { fontSize: 22, color: '#fff' },
  headerTitle: { fontSize: 15, fontWeight: '800', color: '#fff' },

  scroll: { paddingHorizontal: 20, paddingBottom: 48 },

  // Hero
  hero: { alignItems: 'center', paddingTop: 28, paddingBottom: 24 },
  heroCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#0d1a0d', borderWidth: 2, borderColor: '#2e5c2e',
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  heroEmoji: { fontSize: 32 },
  heroName: { fontSize: 22, fontWeight: '900', color: '#fff', marginBottom: 4 },
  heroSub: { fontSize: 12, color: '#333', fontWeight: '600' },

  // Create CTA
  createCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#0d1a0d',
    borderWidth: 1.5, borderColor: '#4CAF50',
    borderRadius: 14, padding: 16, marginBottom: 28,
  },
  createLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  createIconCircle: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#4CAF50',
    alignItems: 'center', justifyContent: 'center',
  },
  createIconText: { fontSize: 20, color: '#fff', fontWeight: '700', lineHeight: 24 },
  createTitle: { fontSize: 15, fontWeight: '800', color: '#4CAF50', marginBottom: 2 },
  createSub: { fontSize: 11, color: '#2e5c2e', textTransform: 'capitalize' },
  createArrow: { fontSize: 18, color: '#4CAF50' },

  // Sections
  sectionLabel: {
    fontSize: 10, fontWeight: '800', color: '#333',
    letterSpacing: 1.5, marginBottom: 10,
  },

  // Generic card
  card: {
    backgroundColor: '#111', borderRadius: 14,
    borderWidth: 1, borderColor: '#1e1e1e',
    padding: 16, marginBottom: 24,
  },
  cardHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 4,
  },
  cardDate: { fontSize: 14, fontWeight: '800', color: '#fff', textTransform: 'capitalize' },
  cardMeta: { fontSize: 11, color: '#444', marginBottom: 14 },

  // Delete button
  deleteBtn: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(244,67,54,0.1)',
    borderWidth: 1, borderColor: 'rgba(244,67,54,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  deleteBtnText: { fontSize: 11, color: '#F44336', fontWeight: '700' },

  // Progress bar
  progRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progLabel: { fontSize: 12, color: '#888', fontWeight: '600' },
  progBench: { fontSize: 11, color: '#555' },
  progTrack: { height: 4, backgroundColor: '#1a1a1a', borderRadius: 2, overflow: 'hidden', marginBottom: 14 },
  progFill: { height: '100%', backgroundColor: '#4CAF50', borderRadius: 2 },

  // Card action buttons
  cardActions: { flexDirection: 'row', gap: 8 },
  actionBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', borderWidth: 1 },
  actionOpen:  { backgroundColor: 'rgba(76,175,80,0.1)', borderColor: '#4CAF50' },
  actionClose: { backgroundColor: 'rgba(244,67,54,0.08)', borderColor: '#F44336' },
  actionCompo: { backgroundColor: 'rgba(100,181,246,0.08)', borderColor: '#64B5F6' },
  actionBtnText: { fontSize: 12, fontWeight: '700', color: '#ddd' },

  // Scoreboard
  scoreBoard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 8, marginBottom: 16,
  },
  scoreDash: { fontSize: 36, color: '#2a2a2a', fontWeight: '200' },

  // Score counter
  counter: { flex: 1, alignItems: 'flex-start', gap: 4 },
  counterRight: { alignItems: 'flex-end' },
  counterTeam: { fontSize: 11, fontWeight: '700', letterSpacing: 0.3, maxWidth: 110 },
  counterNum: { fontSize: 72, fontWeight: '900', lineHeight: 80 },
  counterBtns: { flexDirection: 'row', gap: 8 },
  counterBtnsRight: { flexDirection: 'row-reverse' },
  cBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#2a2a2a',
    alignItems: 'center', justifyContent: 'center',
  },
  cBtnPlus: { backgroundColor: '#1a3a1a', borderColor: '#4CAF50' },
  cBtnText: { fontSize: 20, fontWeight: '600', color: '#888', lineHeight: 24 },

  // Confirm button
  confirmBtn: {
    backgroundColor: '#4CAF50', borderRadius: 12,
    paddingVertical: 14, alignItems: 'center',
  },
  confirmBtnText: { fontSize: 13, fontWeight: '800', color: '#fff' },

  // Score confirmed state
  confirmedBox: { alignItems: 'center', paddingVertical: 20, gap: 8 },
  confirmedCheck: { fontSize: 40, color: '#4CAF50' },
  confirmedTitle: { fontSize: 16, fontWeight: '800', color: '#fff' },
  confirmedSub: { fontSize: 13, color: '#555', textAlign: 'center' },
});
