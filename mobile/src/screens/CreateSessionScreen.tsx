import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useRef, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useT, FR_MONTH_NAMES, FR_DAY_NAMES } from '../i18n';
import { RootStackParamList } from '../navigation/RootNavigator';
import { GROUP_CONFIG } from '../types/session';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const FR_MONTHS = FR_MONTH_NAMES;
const FR_DAYS   = FR_DAY_NAMES;

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function nextNOccurrences(dayOfWeek: number, n: number): Date[] {
  const result: Date[] = [];
  const d = new Date();
  const diff = (dayOfWeek - d.getDay() + 7) % 7 || 7;
  d.setDate(d.getDate() + diff);
  for (let i = 0; i < n; i++) {
    result.push(new Date(d));
    d.setDate(d.getDate() + 7);
  }
  return result;
}

function toFrStr(d: Date): string {
  return `${d.getDate()} ${FR_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export default function CreateSessionScreen() {
  const navigation = useNavigation<Nav>();
  const t = useT();

  const upcomingDates = useState(() => nextNOccurrences(GROUP_CONFIG.defaultDayOfWeek, 6))[0];

  const [step, setStep]           = useState(0);
  const [selectedKeys, setSelected] = useState<Set<string>>(
    () => new Set(upcomingDates.map(dateKey))
  );
  const [hour, setHour]           = useState(() => parseInt(GROUP_CONFIG.defaultTime.split(':')[0]) || 21);
  const [minute, setMinute]       = useState(() => parseInt(GROUP_CONFIG.defaultTime.split(':')[1]) || 30);
  const [location, setLocation]   = useState(GROUP_CONFIG.defaultLocation);
  const [maxPlayers, setMax]      = useState(GROUP_CONFIG.defaultMaxPlayers);
  const [published, setPublished] = useState(false);

  const fadeAnim  = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const doneScale = useRef(new Animated.Value(0)).current;

  const selectedDates = upcomingDates.filter(d => selectedKeys.has(dateKey(d)));

  function toggleDate(d: Date) {
    const key = dateKey(d);
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }

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
    setTimeout(() => navigation.goBack(), 2200);
  }

  const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  const noneSelected = selectedDates.length === 0;

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

          {/* ── Step 0: Dates & heure ── */}
          {step === 0 && (
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.stepLabel}>{t.coach.stepDate}</Text>

              {/* Date chips */}
              <View style={styles.chipsCol}>
                {upcomingDates.map(d => {
                  const key = dateKey(d);
                  const on  = selectedKeys.has(key);
                  return (
                    <Pressable
                      key={key}
                      style={[styles.chip, on ? styles.chipOn : styles.chipOff]}
                      onPress={() => toggleDate(d)}
                    >
                      <View style={[styles.chipBox, on && styles.chipBoxOn]}>
                        {on && <Text style={styles.chipTick}>✓</Text>}
                      </View>
                      <View style={styles.chipTexts}>
                        <Text style={[styles.chipDay, !on && styles.dimText]}>
                          {FR_DAYS[d.getDay()].toUpperCase()}
                        </Text>
                        <Text style={[styles.chipDate, !on && styles.dimText]}>
                          {toFrStr(d)}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>

              {/* Time selector */}
              <View style={styles.timeRow}>
                <TimeCounter value={hour}   min={0}  max={23} step={1}
                  onChange={setHour}   label={String(hour).padStart(2, '0')} />
                <Text style={styles.timeSep}>:</Text>
                <TimeCounter value={minute} min={0}  max={55} step={5}
                  onChange={setMinute} label={String(minute).padStart(2, '0')} />
              </View>

              <TouchableOpacity
                style={[styles.nextBtn, noneSelected && styles.nextBtnOff]}
                onPress={() => !noneSelected && goTo(1)}
                activeOpacity={noneSelected ? 1 : 0.75}
              >
                <Text style={styles.nextBtnText}>
                  {noneSelected
                    ? 'Sélectionne au moins une date'
                    : `${t.coach.next} (${selectedDates.length})`}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          )}

          {/* ── Step 1: Lieu ── */}
          {step === 1 && (
            <View style={{ flex: 1, paddingTop: 8 }}>
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
                  <Pressable style={styles.maxBtn} onPress={() => setMax(v => Math.max(2, v - 2))}>
                    <Text style={styles.maxBtnText}>−</Text>
                  </Pressable>
                  <Text style={styles.maxVal}>{maxPlayers}</Text>
                  <Pressable style={styles.maxBtn} onPress={() => setMax(v => Math.min(20, v + 2))}>
                    <Text style={styles.maxBtnText}>+</Text>
                  </Pressable>
                </View>
              </View>

              <TouchableOpacity style={[styles.nextBtn, { marginTop: 'auto' as any }]} onPress={() => goTo(2)}>
                <Text style={styles.nextBtnText}>{t.coach.next}</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── Step 2: Résumé & publication ── */}
          {step === 2 && (
            published ? (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <Animated.View style={[styles.doneBox, { transform: [{ scale: doneScale }] }]}>
                  <Text style={styles.doneCheck}>✓</Text>
                  <Text style={styles.doneTitle}>
                    {selectedDates.length} session{selectedDates.length > 1 ? 's' : ''} publiée{selectedDates.length > 1 ? 's' : ''} !
                  </Text>
                  <Text style={styles.doneSub}>{timeStr} · {location || GROUP_CONFIG.defaultLocation}</Text>
                </Animated.View>
              </View>
            ) : (
              <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
              >
                <Text style={styles.stepLabel}>{t.coach.stepSummary}</Text>

                <View style={styles.summaryCard}>
                  {/* Dates list */}
                  <View style={styles.summaryDatesRow}>
                    <Text style={styles.summaryIcon}>📅</Text>
                    <View style={{ flex: 1, gap: 5 }}>
                      {selectedDates.map(d => (
                        <Text key={dateKey(d)} style={styles.summaryDateItem}>
                          {FR_DAYS[d.getDay()]} {toFrStr(d)}
                        </Text>
                      ))}
                    </View>
                  </View>
                  <SummaryRow icon="🕐" value={timeStr} />
                  {location ? <SummaryRow icon="📍" value={location} /> : null}
                  <SummaryRow icon="👥" value={`${maxPlayers} joueurs max`} />
                  <SummaryRow icon="🔓" value="Inscriptions ouvertes à la publication" dim />
                </View>

                <TouchableOpacity style={styles.publishBtn} onPress={handlePublish}>
                  <Text style={styles.publishBtnText}>
                    {t.coach.publish} ({selectedDates.length})
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            )
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

  dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingVertical: 16 },
  dot: {
    width: 7, height: 7, borderRadius: 4,
    backgroundColor: '#1e1e1e', borderWidth: 1, borderColor: '#2a2a2a',
  },
  dotActive: { backgroundColor: '#4CAF50', borderColor: '#4CAF50', width: 22 },

  stepContainer: { flex: 1, paddingHorizontal: 24 },
  scrollContent: { paddingTop: 8, paddingBottom: 32 },
  stepLabel: {
    fontSize: 10, fontWeight: '800', color: '#333',
    letterSpacing: 2, marginBottom: 20,
  },

  // Date chips
  chipsCol: { gap: 8, marginBottom: 28 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderRadius: 14, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 14,
  },
  chipOn:  { backgroundColor: '#0d1a0d', borderColor: '#4CAF50' },
  chipOff: { backgroundColor: '#0e0e0e', borderColor: '#1e1e1e' },
  chipBox: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 1.5, borderColor: '#2a2a2a',
    alignItems: 'center', justifyContent: 'center',
  },
  chipBoxOn: { backgroundColor: '#4CAF50', borderColor: '#4CAF50' },
  chipTick: { fontSize: 12, color: '#fff', fontWeight: '900' },
  chipTexts: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  chipDay:  { fontSize: 13, fontWeight: '900', color: '#fff', letterSpacing: 0.5 },
  chipDate: { fontSize: 12, color: '#888', fontWeight: '600' },
  dimText:  { color: '#2a2a2a' },

  // Time selector
  timeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 28 },
  timeSep: { fontSize: 40, color: '#333', fontWeight: '200', marginBottom: 4 },
  timeCounter: { alignItems: 'center', gap: 6 },
  timeBtn: {
    width: 40, height: 32, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#141414', borderRadius: 8,
  },
  timeBtnText: { fontSize: 12, color: '#555' },
  timeNum: { fontSize: 56, fontWeight: '900', color: '#fff', lineHeight: 64 },

  // Input block (step 1)
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
    paddingVertical: 16, alignItems: 'center',
  },
  nextBtnOff: { backgroundColor: '#1a1a1a' },
  nextBtnText: { fontSize: 14, fontWeight: '800', color: '#fff' },
  publishBtn: {
    backgroundColor: '#4CAF50', borderRadius: 14,
    paddingVertical: 18, alignItems: 'center',
  },
  publishBtnText: { fontSize: 16, fontWeight: '900', color: '#fff', letterSpacing: 0.5 },

  // Summary card
  summaryCard: {
    backgroundColor: '#111', borderRadius: 14,
    borderWidth: 1, borderColor: '#1e1e1e',
    padding: 16, gap: 12, marginBottom: 24,
  },
  summaryDatesRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  summaryDateItem: { fontSize: 13, color: '#ddd', fontWeight: '600', textTransform: 'capitalize' },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  summaryIcon: { fontSize: 16, width: 24 },
  summaryValue: { fontSize: 14, color: '#ddd', fontWeight: '600', flex: 1 },
  summaryDim: { color: '#2a2a2a', fontSize: 12 },

  // Done animation
  doneBox: { alignItems: 'center', gap: 12 },
  doneCheck: { fontSize: 64, color: '#4CAF50' },
  doneTitle: { fontSize: 22, fontWeight: '900', color: '#fff', textAlign: 'center' },
  doneSub: { fontSize: 14, color: '#555' },
});
