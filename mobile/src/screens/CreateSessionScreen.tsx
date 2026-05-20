import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useRef, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useT } from '../i18n';
import { RootStackParamList } from '../navigation/RootNavigator';
import { GROUP_CONFIG } from '../types/session';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const FR_MONTHS = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
const FR_DAYS   = ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];

function nextOccurrence(dayOfWeek: number): Date {
  const d = new Date();
  const diff = (dayOfWeek - d.getDay() + 7) % 7 || 7;
  d.setDate(d.getDate() + diff);
  return d;
}

function toFrStr(d: Date): string {
  return `${d.getDate()} ${FR_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export default function CreateSessionScreen() {
  const navigation = useNavigation<Nav>();
  const t = useT();

  const [step, setStep]         = useState(0);
  const [date, setDate]         = useState(() => nextOccurrence(GROUP_CONFIG.defaultDayOfWeek));
  const [hour, setHour]         = useState(() => parseInt(GROUP_CONFIG.defaultTime.split(':')[0]) || 21);
  const [minute, setMinute]     = useState(() => parseInt(GROUP_CONFIG.defaultTime.split(':')[1]) || 30);
  const [location, setLocation] = useState(GROUP_CONFIG.defaultLocation);
  const [maxPlayers, setMax]    = useState(GROUP_CONFIG.defaultMaxPlayers);
  const [published, setPublished] = useState(false);

  const fadeAnim  = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const doneScale = useRef(new Animated.Value(0)).current;

  function goTo(next: number, dir: 'fwd' | 'back' = 'fwd') {
    const exitX  = dir === 'fwd' ? -40 : 40;
    const entryX = dir === 'fwd' ?  40 : -40;
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 0, duration: 130, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: exitX, duration: 130, useNativeDriver: true }),
    ]).start(() => {
      setStep(next);
      slideAnim.setValue(entryX);
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 1, duration: 180, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, friction: 8, useNativeDriver: true }),
      ]).start();
    });
  }

  function handlePublish() {
    setPublished(true);
    Animated.spring(doneScale, { toValue: 1, friction: 4, useNativeDriver: true }).start();
    setTimeout(() => navigation.goBack(), 1800);
  }

  const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => step === 0 ? navigation.goBack() : goTo(step - 1, 'back')}
          style={styles.backBtn}
        >
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t.coach.createTitle}</Text>
        <View style={styles.backBtn} />
      </View>

      {/* Step dots */}
      <View style={styles.dotsRow}>
        {[0, 1, 2].map(i => (
          <View key={i} style={[styles.dot, step === i && styles.dotActive]} />
        ))}
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Animated.View style={[styles.stepContainer, {
          opacity: fadeAnim,
          transform: [{ translateX: slideAnim }],
        }]}>

          {/* ── Step 0: Date & heure ── */}
          {step === 0 && (
            <View style={styles.step}>
              <Text style={styles.stepLabel}>{t.coach.stepDate}</Text>

              {/* Date navigator */}
              <View style={styles.dateCard}>
                <Pressable style={styles.dateArrow} onPress={() => {
                  const d = new Date(date); d.setDate(d.getDate() - 1); setDate(d);
                }}>
                  <Text style={styles.dateArrowText}>‹</Text>
                </Pressable>

                <View style={styles.dateCenter}>
                  <Text style={styles.dateDayName}>{FR_DAYS[date.getDay()].toUpperCase()}</Text>
                  <Text style={styles.dateValue}>
                    {date.getDate()} {FR_MONTHS[date.getMonth()]} {date.getFullYear()}
                  </Text>
                </View>

                <Pressable style={styles.dateArrow} onPress={() => {
                  const d = new Date(date); d.setDate(d.getDate() + 1); setDate(d);
                }}>
                  <Text style={styles.dateArrowText}>›</Text>
                </Pressable>
              </View>

              {/* Time selector */}
              <View style={styles.timeRow}>
                <TimeCounter
                  value={hour} min={0} max={23} step={1}
                  onChange={setHour}
                  label={String(hour).padStart(2, '0')}
                />
                <Text style={styles.timeSep}>:</Text>
                <TimeCounter
                  value={minute} min={0} max={55} step={5}
                  onChange={setMinute}
                  label={String(minute).padStart(2, '0')}
                />
              </View>

              <TouchableOpacity style={styles.nextBtn} onPress={() => goTo(1)}>
                <Text style={styles.nextBtnText}>{t.coach.next}</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── Step 1: Lieu ── */}
          {step === 1 && (
            <View style={styles.step}>
              <Text style={styles.stepLabel}>{t.coach.stepLocation}</Text>

              <View style={styles.inputBlock}>
                <Text style={styles.inputLabel}>{t.coach.location}</Text>
                <TextInput
                  style={styles.textInput}
                  value={location}
                  onChangeText={setLocation}
                  placeholder="Urban Soccer Gennevilliers"
                  placeholderTextColor="#2a2a2a"
                  autoFocus
                />
              </View>

              <View style={styles.inputBlock}>
                <Text style={styles.inputLabel}>{t.coach.maxPlayers}</Text>
                <View style={styles.maxRow}>
                  <Pressable
                    style={styles.maxBtn}
                    onPress={() => setMax(v => Math.max(2, v - 2))}
                  >
                    <Text style={styles.maxBtnText}>−</Text>
                  </Pressable>
                  <Text style={styles.maxVal}>{maxPlayers}</Text>
                  <Pressable
                    style={styles.maxBtn}
                    onPress={() => setMax(v => Math.min(20, v + 2))}
                  >
                    <Text style={styles.maxBtnText}>+</Text>
                  </Pressable>
                </View>
              </View>

              <TouchableOpacity style={styles.nextBtn} onPress={() => goTo(2)}>
                <Text style={styles.nextBtnText}>{t.coach.next}</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── Step 2: Résumé & publication ── */}
          {step === 2 && (
            <View style={styles.step}>
              <Text style={styles.stepLabel}>{t.coach.stepSummary}</Text>

              {published ? (
                <Animated.View style={[styles.doneBox, { transform: [{ scale: doneScale }] }]}>
                  <Text style={styles.doneCheck}>✓</Text>
                  <Text style={styles.doneTitle}>{t.coach.published}</Text>
                  <Text style={styles.doneSub}>{FR_DAYS[date.getDay()]} {toFrStr(date)}</Text>
                </Animated.View>
              ) : (
                <>
                  <View style={styles.summaryCard}>
                    <SummaryRow icon="📅" value={`${FR_DAYS[date.getDay()]} ${toFrStr(date)}`} />
                    <SummaryRow icon="🕐" value={timeStr} />
                    {location ? <SummaryRow icon="📍" value={location} /> : null}
                    <SummaryRow icon="👥" value={`${maxPlayers} joueurs max`} />
                    <SummaryRow icon="🔓" value="Inscriptions ouvertes à la publication" dim />
                  </View>

                  <TouchableOpacity style={styles.publishBtn} onPress={handlePublish}>
                    <Text style={styles.publishBtnText}>{t.coach.publish}</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}

        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── TimeCounter ──────────────────────────────────────────────────

function TimeCounter({
  value, min, max, step: increment, label, onChange,
}: {
  value: number; min: number; max: number; step: number;
  label: string; onChange: (v: number) => void;
}) {
  const scaleUp   = useRef(new Animated.Value(1)).current;
  const scaleDown = useRef(new Animated.Value(1)).current;

  function tap(btn: Animated.Value, delta: number) {
    Animated.sequence([
      Animated.timing(btn, { toValue: 0.7, duration: 70, useNativeDriver: true }),
      Animated.spring(btn, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();
    const next = value + delta;
    if (next < min || next > max) return;
    onChange(next);
  }

  return (
    <View style={styles.timeCounter}>
      <Pressable onPress={() => tap(scaleUp, increment)}>
        <Animated.View style={[styles.timeBtn, { transform: [{ scale: scaleUp }] }]}>
          <Text style={styles.timeBtnText}>▲</Text>
        </Animated.View>
      </Pressable>
      <Text style={styles.timeNum}>{label}</Text>
      <Pressable onPress={() => tap(scaleDown, -increment)}>
        <Animated.View style={[styles.timeBtn, { transform: [{ scale: scaleDown }] }]}>
          <Text style={styles.timeBtnText}>▼</Text>
        </Animated.View>
      </Pressable>
    </View>
  );
}

// ─── SummaryRow ───────────────────────────────────────────────────

function SummaryRow({ icon, value, dim }: { icon: string; value: string; dim?: boolean }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryIcon}>{icon}</Text>
      <Text style={[styles.summaryValue, dim && styles.summaryDim]}>{value}</Text>
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

  // Step indicator
  dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingVertical: 16 },
  dot: {
    width: 7, height: 7, borderRadius: 4,
    backgroundColor: '#1e1e1e', borderWidth: 1, borderColor: '#2a2a2a',
  },
  dotActive: { backgroundColor: '#4CAF50', borderColor: '#4CAF50', width: 22 },

  // Step wrapper
  stepContainer: { flex: 1, paddingHorizontal: 24 },
  step: { flex: 1, paddingTop: 8 },
  stepLabel: {
    fontSize: 10, fontWeight: '800', color: '#333',
    letterSpacing: 2, marginBottom: 24,
  },

  // Date navigator
  dateCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#111', borderRadius: 16,
    borderWidth: 1, borderColor: '#1e1e1e',
    marginBottom: 28,
  },
  dateArrow: { padding: 20 },
  dateArrowText: { fontSize: 32, color: '#555', fontWeight: '200' },
  dateCenter: { flex: 1, alignItems: 'center', paddingVertical: 20 },
  dateDayName: { fontSize: 28, fontWeight: '900', color: '#4CAF50', letterSpacing: 2 },
  dateValue: { fontSize: 14, color: '#666', marginTop: 4, fontWeight: '600' },

  // Time selector
  timeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 36 },
  timeSep: { fontSize: 40, color: '#333', fontWeight: '200', marginBottom: 4 },
  timeCounter: { alignItems: 'center', gap: 6 },
  timeBtn: {
    width: 40, height: 32, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#141414', borderRadius: 8,
  },
  timeBtnText: { fontSize: 12, color: '#555' },
  timeNum: { fontSize: 56, fontWeight: '900', color: '#fff', lineHeight: 64 },

  // Input block
  inputBlock: { marginBottom: 24 },
  inputLabel: { fontSize: 10, color: '#333', fontWeight: '700', letterSpacing: 1.5, marginBottom: 8 },
  textInput: {
    backgroundColor: '#111', borderRadius: 12,
    borderWidth: 1, borderColor: '#1e1e1e',
    paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 15, color: '#fff', fontWeight: '600',
  },
  maxRow: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  maxBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#141414', borderWidth: 1, borderColor: '#2a2a2a',
    alignItems: 'center', justifyContent: 'center',
  },
  maxBtnText: { fontSize: 20, color: '#888', fontWeight: '600' },
  maxVal: { fontSize: 32, fontWeight: '900', color: '#fff', minWidth: 48, textAlign: 'center' },

  // Buttons
  nextBtn: {
    backgroundColor: '#4CAF50', borderRadius: 14,
    paddingVertical: 16, alignItems: 'center', marginTop: 'auto' as any,
  },
  nextBtnText: { fontSize: 14, fontWeight: '800', color: '#fff' },
  publishBtn: {
    backgroundColor: '#4CAF50', borderRadius: 14,
    paddingVertical: 18, alignItems: 'center', marginTop: 'auto' as any,
  },
  publishBtnText: { fontSize: 16, fontWeight: '900', color: '#fff', letterSpacing: 0.5 },

  // Summary card
  summaryCard: {
    backgroundColor: '#111', borderRadius: 14,
    borderWidth: 1, borderColor: '#1e1e1e',
    padding: 16, gap: 12, marginBottom: 24,
  },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  summaryIcon: { fontSize: 16, width: 24 },
  summaryValue: { fontSize: 14, color: '#ddd', fontWeight: '600', flex: 1 },
  summaryDim: { color: '#2a2a2a', fontSize: 12 },

  // Done animation
  doneBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  doneCheck: { fontSize: 64, color: '#4CAF50' },
  doneTitle: { fontSize: 22, fontWeight: '900', color: '#fff' },
  doneSub: { fontSize: 14, color: '#555', textTransform: 'capitalize' },
});
