import { useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Criterion, OnboardingProfile, Position } from '../store/useOnboarding';

type Props = {
  onDone: (profile: OnboardingProfile) => void;
};

// ─── Data ─────────────────────────────────────────────────────────

const POSITIONS: { key: Position; label: string; icon: string; desc: string }[] = [
  { key: 'GK',  label: 'Gardien',  icon: '🧤', desc: 'Dernier rempart' },
  { key: 'DEF', label: 'Défenseur', icon: '🛡️', desc: 'Propre derrière' },
  { key: 'MIL', label: 'Milieu',   icon: '🔄', desc: 'Moteur du jeu' },
  { key: 'ATT', label: 'Attaquant', icon: '⚡', desc: 'Finisseur' },
];

const CRITERIA: { key: Criterion; label: string; icon: string }[] = [
  { key: 'endurance',  label: 'Endurance',  icon: '🫁' },
  { key: 'vitesse',    label: 'Vitesse',    icon: '💨' },
  { key: 'technique',  label: 'Technique',  icon: '🎯' },
  { key: 'vision',     label: 'Vision',     icon: '👁️' },
  { key: 'physique',   label: 'Physique',   icon: '💪' },
  { key: 'leadership', label: 'Leadership', icon: '🗣️' },
];

// ─── Screen ───────────────────────────────────────────────────────

export default function OnboardingScreen({ onDone }: Props) {
  const [step, setStep]           = useState(0);
  const [position, setPosition]   = useState<Position | null>(null);
  const [strength, setStrength]   = useState<Criterion | null>(null);
  const [weakness, setWeakness]   = useState<Criterion | null>(null);

  const fadeAnim  = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const doneScale = useRef(new Animated.Value(0)).current;

  function goTo(next: number) {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 0, duration: 120, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: -30, duration: 120, useNativeDriver: true }),
    ]).start(() => {
      setStep(next);
      slideAnim.setValue(30);
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 1, duration: 180, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, friction: 8, useNativeDriver: true }),
      ]).start();
    });
  }

  function handleFinish() {
    if (!position || !strength || !weakness) return;
    Animated.spring(doneScale, { toValue: 1, friction: 4, useNativeDriver: true }).start();
    setTimeout(() => onDone({ position, strength, weakness }), 1600);
  }

  const STEPS = [
    { title: 'Ta position naturelle', subtitle: "Là où tu te sens le plus à l'aise" },
    { title: 'Ta plus grande force', subtitle: 'Ce qui te distingue sur le terrain' },
    { title: 'Ta principale faiblesse', subtitle: 'Sois honnête, ça aide à équilibrer les équipes' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Brand header */}
      <View style={styles.brand}>
        <Text style={styles.brandIcon}>⚽</Text>
        <Text style={styles.brandName}>Five App</Text>
      </View>

      {/* Step dots */}
      <View style={styles.dotsRow}>
        {[0, 1, 2].map(i => (
          <View key={i} style={[styles.dot, step >= i && styles.dotDone, step === i && styles.dotActive]} />
        ))}
      </View>

      <Animated.View style={[styles.content, {
        opacity: fadeAnim,
        transform: [{ translateX: slideAnim }],
      }]}>
        {/* Done state */}
        {step === 3 ? (
          <Animated.View style={[styles.doneBox, { transform: [{ scale: doneScale }] }]}>
            <Text style={styles.doneCheck}>✓</Text>
            <Text style={styles.doneTitle}>Profil créé !</Text>
            <Text style={styles.doneSub}>Tu rejoins le groupe</Text>
          </Animated.View>
        ) : (
          <>
            <Text style={styles.stepCount}>ÉTAPE {step + 1} / 3</Text>
            <Text style={styles.title}>{STEPS[step].title}</Text>
            <Text style={styles.subtitle}>{STEPS[step].subtitle}</Text>

            {/* Step 0: positions */}
            {step === 0 && (
              <View style={styles.grid2}>
                {POSITIONS.map(p => (
                  <OptionCard
                    key={p.key}
                    icon={p.icon}
                    label={p.label}
                    desc={p.desc}
                    selected={position === p.key}
                    onPress={() => setPosition(p.key)}
                  />
                ))}
              </View>
            )}

            {/* Step 1: strength */}
            {step === 1 && (
              <View style={styles.grid3}>
                {CRITERIA.map(c => (
                  <CriterionCard
                    key={c.key}
                    icon={c.icon}
                    label={c.label}
                    selected={strength === c.key}
                    disabled={false}
                    onPress={() => setStrength(c.key)}
                  />
                ))}
              </View>
            )}

            {/* Step 2: weakness */}
            {step === 2 && (
              <View style={styles.grid3}>
                {CRITERIA.map(c => (
                  <CriterionCard
                    key={c.key}
                    icon={c.icon}
                    label={c.label}
                    selected={weakness === c.key}
                    disabled={c.key === strength}
                    onPress={() => c.key !== strength && setWeakness(c.key)}
                  />
                ))}
              </View>
            )}

            {/* Next / Finish */}
            <TouchableOpacity
              style={[
                styles.nextBtn,
                (step === 0 && !position) ||
                (step === 1 && !strength) ||
                (step === 2 && !weakness)
                  ? styles.nextBtnOff
                  : null,
              ]}
              onPress={() => {
                if (step === 0 && position) goTo(1);
                else if (step === 1 && strength) goTo(2);
                else if (step === 2 && weakness) { goTo(3); handleFinish(); }
              }}
            >
              <Text style={styles.nextBtnText}>
                {step < 2 ? 'Suivant →' : 'Terminer →'}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </Animated.View>
    </SafeAreaView>
  );
}

// ─── Sub-components ───────────────────────────────────────────────

function OptionCard({
  icon, label, desc, selected, onPress,
}: {
  icon: string; label: string; desc: string; selected: boolean; onPress: () => void;
}) {
  return (
    <Pressable style={[styles.optCard, selected && styles.optCardOn]} onPress={onPress}>
      <Text style={styles.optIcon}>{icon}</Text>
      <Text style={[styles.optLabel, selected && styles.optLabelOn]}>{label}</Text>
      <Text style={[styles.optDesc, selected && styles.optDescOn]}>{desc}</Text>
    </Pressable>
  );
}

function CriterionCard({
  icon, label, selected, disabled, onPress,
}: {
  icon: string; label: string; selected: boolean; disabled: boolean; onPress: () => void;
}) {
  return (
    <Pressable
      style={[
        styles.critCard,
        selected && styles.critCardOn,
        disabled && styles.critCardOff,
      ]}
      onPress={onPress}
    >
      <Text style={[styles.critIcon, disabled && styles.critDisabledText]}>{icon}</Text>
      <Text style={[styles.critLabel, selected && styles.critLabelOn, disabled && styles.critDisabledText]}>
        {label}
      </Text>
    </Pressable>
  );
}

// ─── Styles ───────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },

  brand: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingTop: 24, paddingBottom: 8 },
  brandIcon: { fontSize: 22 },
  brandName: { fontSize: 16, fontWeight: '900', color: '#fff', letterSpacing: 1 },

  dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingVertical: 16 },
  dot: {
    width: 7, height: 7, borderRadius: 4,
    backgroundColor: '#1e1e1e', borderWidth: 1, borderColor: '#2a2a2a',
  },
  dotDone:   { backgroundColor: '#1e3a1e', borderColor: '#2e5c2e' },
  dotActive: { backgroundColor: '#4CAF50', borderColor: '#4CAF50', width: 22 },

  content: { flex: 1, paddingHorizontal: 24, paddingTop: 8 },

  stepCount: { fontSize: 10, fontWeight: '800', color: '#333', letterSpacing: 2, marginBottom: 10 },
  title:     { fontSize: 26, fontWeight: '900', color: '#fff', marginBottom: 6, lineHeight: 32 },
  subtitle:  { fontSize: 13, color: '#444', marginBottom: 32, lineHeight: 18 },

  // 2-column grid for positions
  grid2: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 28 },
  optCard: {
    width: '47%',
    backgroundColor: '#111', borderRadius: 16,
    borderWidth: 1, borderColor: '#1e1e1e',
    padding: 18, alignItems: 'center', gap: 6,
  },
  optCardOn: { backgroundColor: '#0d1a0d', borderColor: '#4CAF50' },
  optIcon:   { fontSize: 28 },
  optLabel:  { fontSize: 14, fontWeight: '800', color: '#666' },
  optLabelOn:{ color: '#fff' },
  optDesc:   { fontSize: 11, color: '#2a2a2a', textAlign: 'center' },
  optDescOn: { color: '#3a6e3a' },

  // 3-column grid for criteria
  grid3: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 28 },
  critCard: {
    width: '30%',
    backgroundColor: '#111', borderRadius: 14,
    borderWidth: 1, borderColor: '#1e1e1e',
    paddingVertical: 16, alignItems: 'center', gap: 6,
  },
  critCardOn:  { backgroundColor: '#0d1a0d', borderColor: '#4CAF50' },
  critCardOff: { opacity: 0.25 },
  critIcon:  { fontSize: 22 },
  critLabel: { fontSize: 11, fontWeight: '700', color: '#555', textAlign: 'center' },
  critLabelOn: { color: '#4CAF50' },
  critDisabledText: {},

  // Buttons
  nextBtn: {
    backgroundColor: '#4CAF50', borderRadius: 14,
    paddingVertical: 16, alignItems: 'center', marginTop: 'auto' as any,
  },
  nextBtnOff: { backgroundColor: '#1a1a1a' },
  nextBtnText: { fontSize: 15, fontWeight: '800', color: '#fff' },

  // Done
  doneBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  doneCheck: { fontSize: 64, color: '#4CAF50' },
  doneTitle: { fontSize: 26, fontWeight: '900', color: '#fff' },
  doneSub:   { fontSize: 14, color: '#555' },
});
