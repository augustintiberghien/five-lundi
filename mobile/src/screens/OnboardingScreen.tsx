import * as ImagePicker from 'expo-image-picker';
import { useRef, useState } from 'react';
import {
  Animated,
  Image,
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
import { Criterion, OnboardingProfile, Position } from '../store/useOnboarding';

type Props = {
  onDone: (profile: OnboardingProfile) => void;
  initial?: OnboardingProfile;        // set when editing from profile
};

// ─── Static data ──────────────────────────────────────────────────

const POSITIONS: { key: Position; label: string; icon: string; desc: string }[] = [
  { key: 'GK',  label: 'Gardien',   icon: '🧤', desc: 'Dernier rempart' },
  { key: 'DEF', label: 'Défenseur', icon: '🛡️', desc: 'Propre derrière' },
  { key: 'MIL', label: 'Milieu',    icon: '🔄', desc: 'Moteur du jeu' },
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

const TOTAL_STEPS = 5;

// ─── Screen ───────────────────────────────────────────────────────

export default function OnboardingScreen({ onDone, initial }: Props) {
  const isEdit = !!initial;

  const [step, setStep]         = useState(0);
  const [name, setName]         = useState(initial?.name ?? '');
  const [photoUri, setPhotoUri] = useState<string | undefined>(initial?.photoUri);
  const [bio, setBio]           = useState(initial?.bio ?? '');
  const [position, setPosition] = useState<Position | null>(initial?.position ?? null);
  const [strength, setStrength] = useState<Criterion | null>(initial?.strength ?? null);
  const [weakness, setWeakness] = useState<Criterion | null>(initial?.weakness ?? null);

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

  async function pickPhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  }

  function handleFinish() {
    if (!name.trim() || !position || !strength || !weakness) return;
    const profile: OnboardingProfile = {
      name: name.trim(),
      photoUri: photoUri || undefined,
      bio: bio.trim() || undefined,
      position,
      strength,
      weakness,
    };
    Animated.spring(doneScale, { toValue: 1, friction: 4, useNativeDriver: true }).start();
    setTimeout(() => onDone(profile), isEdit ? 0 : 1600);
  }

  const initials = name.trim().split(' ').map(w => w[0]?.toUpperCase() ?? '').join('').slice(0, 2) || '?';

  const canNext = [
    name.trim().length >= 2,  // step 0: nom
    true,                      // step 1: photo (optional)
    true,                      // step 2: bio (optional)
    !!position,                // step 3: position
    !!strength && !!weakness,  // step 4: force + faiblesse
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        {isEdit ? (
          <TouchableOpacity style={styles.backBtn} onPress={() => onDone({
            name: initial!.name, photoUri: initial!.photoUri,
            bio: initial!.bio, position: initial!.position,
            strength: initial!.strength, weakness: initial!.weakness,
          })}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.backBtn}>
            <Text style={styles.brandIcon}>⚽</Text>
          </View>
        )}
        <Text style={styles.headerTitle}>
          {isEdit ? 'Modifier le profil' : 'Créer ton profil'}
        </Text>
        <View style={styles.backBtn} />
      </View>

      {/* Dots */}
      <View style={styles.dotsRow}>
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <View key={i} style={[styles.dot, step > i && styles.dotDone, step === i && styles.dotActive]} />
        ))}
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Animated.View style={[{ flex: 1 }, { opacity: fadeAnim, transform: [{ translateX: slideAnim }] }]}>

          {/* Done state (first launch only) */}
          {step === TOTAL_STEPS ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Animated.View style={[styles.doneBox, { transform: [{ scale: doneScale }] }]}>
                <Text style={styles.doneCheck}>✓</Text>
                <Text style={styles.doneTitle}>Bienvenue {name.trim().split(' ')[0]} !</Text>
                <Text style={styles.doneSub}>Ton profil est prêt</Text>
              </Animated.View>
            </View>
          ) : (
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* ── Step 0: Nom ── */}
              {step === 0 && (
                <>
                  <Text style={styles.stepCount}>ÉTAPE 1 / {TOTAL_STEPS}</Text>
                  <Text style={styles.title}>Comment tu t'appelles ?</Text>
                  <Text style={styles.subtitle}>Ton prénom visible par tout le groupe</Text>

                  {/* Avatar preview */}
                  <View style={styles.avatarPreview}>
                    {photoUri ? (
                      <Image source={{ uri: photoUri }} style={styles.avatarImg} />
                    ) : (
                      <View style={styles.avatarInitials}>
                        <Text style={styles.avatarInitialsText}>{initials}</Text>
                      </View>
                    )}
                  </View>

                  <TextInput
                    style={styles.nameInput}
                    value={name}
                    onChangeText={setName}
                    placeholder="Prénom Nom"
                    placeholderTextColor="#2a2a2a"
                    autoFocus
                    autoCapitalize="words"
                    maxLength={30}
                  />
                </>
              )}

              {/* ── Step 1: Photo ── */}
              {step === 1 && (
                <>
                  <Text style={styles.stepCount}>ÉTAPE 2 / {TOTAL_STEPS}</Text>
                  <Text style={styles.title}>Ta photo de profil</Text>
                  <Text style={styles.subtitle}>Optionnel — tes coéquipiers te reconnaîtront plus facilement</Text>

                  <View style={styles.photoCenter}>
                    <Pressable style={styles.photoPicker} onPress={pickPhoto}>
                      {photoUri ? (
                        <Image source={{ uri: photoUri }} style={styles.photoImg} />
                      ) : (
                        <View style={styles.photoPlaceholder}>
                          <Text style={styles.photoPlaceholderIcon}>📷</Text>
                          <Text style={styles.photoPlaceholderText}>Choisir une photo</Text>
                        </View>
                      )}
                    </Pressable>

                    {photoUri && (
                      <TouchableOpacity style={styles.photoChange} onPress={pickPhoto}>
                        <Text style={styles.photoChangeText}>Changer →</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  <Text style={styles.skipNote}>
                    {photoUri ? "Tu peux continuer ou changer la photo." : "Tu pourras en ajouter une plus tard depuis ton profil."}
                  </Text>
                </>
              )}

              {/* ── Step 2: Bio ── */}
              {step === 2 && (
                <>
                  <Text style={styles.stepCount}>ÉTAPE 3 / {TOTAL_STEPS}</Text>
                  <Text style={styles.title}>Quelques mots sur toi</Text>
                  <Text style={styles.subtitle}>Optionnel — ton style de jeu, ta légende…</Text>

                  <TextInput
                    style={styles.bioInput}
                    value={bio}
                    onChangeText={setBio}
                    placeholder="Ex: Virevoltant mais fragile des chevilles. Meilleure passe de tout le groupe."
                    placeholderTextColor="#2a2a2a"
                    multiline
                    numberOfLines={4}
                    maxLength={160}
                    autoFocus
                  />
                  <Text style={styles.charCount}>{bio.length}/160</Text>
                </>
              )}

              {/* ── Step 3: Position ── */}
              {step === 3 && (
                <>
                  <Text style={styles.stepCount}>ÉTAPE 4 / {TOTAL_STEPS}</Text>
                  <Text style={styles.title}>Ta position naturelle</Text>
                  <Text style={styles.subtitle}>Là où tu te sens le plus à l'aise</Text>

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
                </>
              )}

              {/* ── Step 4: Force + Faiblesse ── */}
              {step === 4 && (
                <>
                  <Text style={styles.stepCount}>ÉTAPE 5 / {TOTAL_STEPS}</Text>
                  <Text style={styles.title}>Force & faiblesse</Text>
                  <Text style={styles.subtitle}>Être honnête aide à équilibrer les équipes</Text>

                  <Text style={styles.sectionMini}>🟢 TA PLUS GRANDE FORCE</Text>
                  <View style={styles.grid3}>
                    {CRITERIA.map(c => (
                      <CriterionCard
                        key={c.key}
                        icon={c.icon}
                        label={c.label}
                        mode={strength === c.key ? 'strength' : weakness === c.key ? 'dim' : 'none'}
                        onPress={() => {
                          if (weakness === c.key) setWeakness(null);
                          setStrength(prev => prev === c.key ? null : c.key);
                        }}
                      />
                    ))}
                  </View>

                  <Text style={[styles.sectionMini, { marginTop: 16 }]}>🔴 TA PRINCIPALE FAIBLESSE</Text>
                  <View style={styles.grid3}>
                    {CRITERIA.map(c => (
                      <CriterionCard
                        key={c.key}
                        icon={c.icon}
                        label={c.label}
                        mode={weakness === c.key ? 'weakness' : strength === c.key ? 'dim' : 'none'}
                        onPress={() => {
                          if (strength === c.key) return;
                          setWeakness(prev => prev === c.key ? null : c.key);
                        }}
                      />
                    ))}
                  </View>
                </>
              )}

              {/* Navigation buttons */}
              <View style={styles.navRow}>
                {step > 0 && (
                  <TouchableOpacity style={styles.prevBtn} onPress={() => goTo(step - 1)}>
                    <Text style={styles.prevBtnText}>←</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.nextBtn, !canNext[step] && styles.nextBtnOff, step > 0 && { flex: 1 }]}
                  onPress={() => {
                    if (!canNext[step]) return;
                    if (step < TOTAL_STEPS - 1) goTo(step + 1);
                    else { goTo(TOTAL_STEPS); handleFinish(); }
                  }}
                >
                  <Text style={styles.nextBtnText}>
                    {step === 0 && !name.trim() ? 'Entre ton prénom'
                      : step === TOTAL_STEPS - 1 ? (isEdit ? 'Enregistrer ✓' : 'Terminer →')
                      : step === 1 && !photoUri ? 'Passer →'
                      : step === 2 && !bio.trim() ? 'Passer →'
                      : 'Suivant →'}
                  </Text>
                </TouchableOpacity>
              </View>

            </ScrollView>
          )}

        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Sub-components ───────────────────────────────────────────────

function OptionCard({ icon, label, desc, selected, onPress }: {
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

function CriterionCard({ icon, label, mode, onPress }: {
  icon: string; label: string;
  mode: 'strength' | 'weakness' | 'dim' | 'none';
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[
        styles.critCard,
        mode === 'strength' && styles.critStrength,
        mode === 'weakness' && styles.critWeakness,
        mode === 'dim'      && styles.critDim,
      ]}
      onPress={onPress}
    >
      <Text style={styles.critIcon}>{icon}</Text>
      <Text style={[
        styles.critLabel,
        mode === 'strength' && styles.critLabelGreen,
        mode === 'weakness' && styles.critLabelRed,
      ]}>
        {label}
      </Text>
    </Pressable>
  );
}

// ─── Styles ───────────────────────────────────────────────────────

const AVATAR = 80;
const PHOTO  = 140;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#1a1a1a',
  },
  backBtn:    { width: 40 },
  backArrow:  { fontSize: 22, color: '#fff' },
  brandIcon:  { fontSize: 22 },
  headerTitle: { fontSize: 15, fontWeight: '800', color: '#fff' },

  dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingVertical: 14 },
  dot:       { width: 7, height: 7, borderRadius: 4, backgroundColor: '#1e1e1e', borderWidth: 1, borderColor: '#2a2a2a' },
  dotDone:   { backgroundColor: '#1e3a1e', borderColor: '#2e5c2e' },
  dotActive: { backgroundColor: '#4CAF50', borderColor: '#4CAF50', width: 22 },

  scrollContent: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 32 },

  stepCount: { fontSize: 10, fontWeight: '800', color: '#333', letterSpacing: 2, marginBottom: 10 },
  title:     { fontSize: 24, fontWeight: '900', color: '#fff', marginBottom: 6, lineHeight: 30 },
  subtitle:  { fontSize: 13, color: '#444', marginBottom: 28, lineHeight: 18 },

  // Step 0: Name
  avatarPreview: { alignItems: 'center', marginBottom: 20 },
  avatarImg: { width: AVATAR, height: AVATAR, borderRadius: AVATAR / 2 },
  avatarInitials: {
    width: AVATAR, height: AVATAR, borderRadius: AVATAR / 2,
    backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#2a2a2a',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarInitialsText: { fontSize: 28, fontWeight: '900', color: '#555' },
  nameInput: {
    backgroundColor: '#111', borderRadius: 14,
    borderWidth: 1, borderColor: '#1e1e1e',
    paddingHorizontal: 18, paddingVertical: 16,
    fontSize: 22, color: '#fff', fontWeight: '700',
    textAlign: 'center', marginBottom: 8,
  },

  // Step 1: Photo
  photoCenter: { alignItems: 'center', marginBottom: 16 },
  photoPicker: {
    width: PHOTO, height: PHOTO, borderRadius: PHOTO / 2,
    overflow: 'hidden',
  },
  photoImg: { width: PHOTO, height: PHOTO, borderRadius: PHOTO / 2 },
  photoPlaceholder: {
    width: PHOTO, height: PHOTO, borderRadius: PHOTO / 2,
    backgroundColor: '#111', borderWidth: 1.5, borderColor: '#2a2a2a',
    borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  photoPlaceholderIcon: { fontSize: 36 },
  photoPlaceholderText: { fontSize: 11, color: '#444', fontWeight: '600' },
  photoChange: { marginTop: 12 },
  photoChangeText: { fontSize: 13, color: '#4CAF50', fontWeight: '700' },
  skipNote: { fontSize: 12, color: '#2a2a2a', textAlign: 'center', lineHeight: 17 },

  // Step 2: Bio
  bioInput: {
    backgroundColor: '#111', borderRadius: 14,
    borderWidth: 1, borderColor: '#1e1e1e',
    paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 15, color: '#fff', lineHeight: 22,
    minHeight: 110, textAlignVertical: 'top', marginBottom: 6,
  },
  charCount: { fontSize: 11, color: '#2a2a2a', textAlign: 'right', marginBottom: 8 },

  // Step 3: Position
  grid2: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 12 },
  optCard: {
    width: '47%', backgroundColor: '#111', borderRadius: 16,
    borderWidth: 1, borderColor: '#1e1e1e',
    padding: 18, alignItems: 'center', gap: 6,
  },
  optCardOn:  { backgroundColor: '#0d1a0d', borderColor: '#4CAF50' },
  optIcon:    { fontSize: 28 },
  optLabel:   { fontSize: 14, fontWeight: '800', color: '#666' },
  optLabelOn: { color: '#fff' },
  optDesc:    { fontSize: 11, color: '#2a2a2a', textAlign: 'center' },
  optDescOn:  { color: '#3a6e3a' },

  // Step 4: Force/Faiblesse
  sectionMini: { fontSize: 10, fontWeight: '800', color: '#333', letterSpacing: 1.5, marginBottom: 10 },
  grid3: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  critCard: {
    width: '30%', backgroundColor: '#111', borderRadius: 14,
    borderWidth: 1, borderColor: '#1e1e1e',
    paddingVertical: 14, alignItems: 'center', gap: 5,
  },
  critStrength: { backgroundColor: '#0d1a0d', borderColor: '#4CAF50' },
  critWeakness: { backgroundColor: '#1a0a0a', borderColor: '#F44336' },
  critDim:      { opacity: 0.25 },
  critIcon:     { fontSize: 20 },
  critLabel:    { fontSize: 11, fontWeight: '700', color: '#555', textAlign: 'center' },
  critLabelGreen: { color: '#4CAF50' },
  critLabelRed:   { color: '#F44336' },

  // Nav row
  navRow: { flexDirection: 'row', gap: 10, marginTop: 28 },
  prevBtn: {
    width: 48, height: 52, borderRadius: 14,
    backgroundColor: '#111', borderWidth: 1, borderColor: '#1e1e1e',
    alignItems: 'center', justifyContent: 'center',
  },
  prevBtnText: { fontSize: 20, color: '#555' },
  nextBtn: {
    flex: 1, backgroundColor: '#4CAF50', borderRadius: 14,
    paddingVertical: 16, alignItems: 'center',
  },
  nextBtnOff: { backgroundColor: '#1a1a1a' },
  nextBtnText: { fontSize: 15, fontWeight: '800', color: '#fff' },

  // Done
  doneBox:   { alignItems: 'center', gap: 14 },
  doneCheck: { fontSize: 64, color: '#4CAF50' },
  doneTitle: { fontSize: 26, fontWeight: '900', color: '#fff' },
  doneSub:   { fontSize: 14, color: '#555' },
});
