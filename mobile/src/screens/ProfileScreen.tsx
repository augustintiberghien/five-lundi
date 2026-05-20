import { useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import OnboardingScreen from './OnboardingScreen';
import { OnboardingProfile, Position, Criterion } from '../store/useOnboarding';

type Props = {
  profile: OnboardingProfile;
  onSave: (p: OnboardingProfile) => void;
  onClose: () => void;
};

const POSITION_LABELS: Record<Position, { label: string; icon: string }> = {
  GK:  { label: 'Gardien',   icon: '🧤' },
  DEF: { label: 'Défenseur', icon: '🛡️' },
  MIL: { label: 'Milieu',    icon: '🔄' },
  ATT: { label: 'Attaquant', icon: '⚡' },
};

const CRITERION_LABELS: Record<Criterion, { label: string; icon: string }> = {
  endurance:  { label: 'Endurance',  icon: '🫁' },
  vitesse:    { label: 'Vitesse',    icon: '💨' },
  technique:  { label: 'Technique',  icon: '🎯' },
  vision:     { label: 'Vision',     icon: '👁️' },
  physique:   { label: 'Physique',   icon: '💪' },
  leadership: { label: 'Leadership', icon: '🗣️' },
};

export default function ProfileScreen({ profile, onSave, onClose }: Props) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <OnboardingScreen
        initial={profile}
        onDone={(p) => {
          onSave(p);
          setEditing(false);
        }}
      />
    );
  }

  const initials = profile.name.split(' ').map(w => w[0]?.toUpperCase() ?? '').join('').slice(0, 2);
  const pos  = POSITION_LABELS[profile.position];
  const str  = CRITERION_LABELS[profile.strength];
  const weak = CRITERION_LABELS[profile.weakness];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={onClose}>
          <Text style={styles.headerBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mon profil</Text>
        <TouchableOpacity style={styles.headerBtn} onPress={() => setEditing(true)}>
          <Text style={styles.editBtnText}>Modifier</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Avatar + name */}
        <View style={styles.hero}>
          {profile.photoUri ? (
            <Image source={{ uri: profile.photoUri }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarInitials}>
              <Text style={styles.avatarInitialsText}>{initials}</Text>
            </View>
          )}
          <Text style={styles.heroName}>{profile.name}</Text>
          {profile.bio ? (
            <Text style={styles.heroBio}>{profile.bio}</Text>
          ) : (
            <TouchableOpacity onPress={() => setEditing(true)}>
              <Text style={styles.addBio}>+ Ajouter une bio</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Position */}
        <Text style={styles.sectionLabel}>POSITION</Text>
        <View style={styles.card}>
          <View style={styles.posRow}>
            <Text style={styles.posIcon}>{pos.icon}</Text>
            <Text style={styles.posLabel}>{pos.label}</Text>
          </View>
        </View>

        {/* Force / Faiblesse */}
        <Text style={styles.sectionLabel}>PROFIL TECHNIQUE</Text>
        <View style={styles.card}>
          <View style={styles.statRow}>
            <View style={styles.statBlock}>
              <Text style={styles.statMini}>🟢 FORCE</Text>
              <View style={styles.statChip}>
                <Text style={styles.statIcon}>{str.icon}</Text>
                <Text style={[styles.statLabel, { color: '#4CAF50' }]}>{str.label}</Text>
              </View>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBlock}>
              <Text style={styles.statMini}>🔴 FAIBLESSE</Text>
              <View style={styles.statChip}>
                <Text style={styles.statIcon}>{weak.icon}</Text>
                <Text style={[styles.statLabel, { color: '#F44336' }]}>{weak.label}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Note */}
        <Text style={styles.note}>
          Ces informations aident le coach à équilibrer les équipes.
          {'\n'}Elles sont visibles uniquement au sein de ton groupe.
        </Text>

      </ScrollView>
    </SafeAreaView>
  );
}

const AVATAR_SIZE = 90;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#1a1a1a',
  },
  headerBtn:     { width: 64 },
  headerBtnText: { fontSize: 22, color: '#fff' },
  editBtnText:   { fontSize: 13, color: '#4CAF50', fontWeight: '700', textAlign: 'right' },
  headerTitle:   { fontSize: 15, fontWeight: '800', color: '#fff' },

  scroll: { paddingHorizontal: 20, paddingBottom: 40 },

  hero: { alignItems: 'center', paddingVertical: 28 },
  avatar: { width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: AVATAR_SIZE / 2, marginBottom: 14 },
  avatarInitials: {
    width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: AVATAR_SIZE / 2,
    backgroundColor: '#1a1a1a', borderWidth: 1.5, borderColor: '#2a2a2a',
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  avatarInitialsText: { fontSize: 32, fontWeight: '900', color: '#555' },
  heroName: { fontSize: 24, fontWeight: '900', color: '#fff', marginBottom: 8 },
  heroBio:  { fontSize: 13, color: '#555', textAlign: 'center', lineHeight: 19, maxWidth: 280 },
  addBio:   { fontSize: 13, color: '#333', fontWeight: '600' },

  sectionLabel: {
    fontSize: 10, fontWeight: '800', color: '#333',
    letterSpacing: 1.5, marginBottom: 10,
  },

  card: {
    backgroundColor: '#111', borderRadius: 14,
    borderWidth: 1, borderColor: '#1e1e1e',
    padding: 16, marginBottom: 24,
  },

  posRow:   { flexDirection: 'row', alignItems: 'center', gap: 12 },
  posIcon:  { fontSize: 28 },
  posLabel: { fontSize: 18, fontWeight: '800', color: '#fff' },

  statRow: { flexDirection: 'row', alignItems: 'center' },
  statBlock: { flex: 1, alignItems: 'center', gap: 8, paddingVertical: 6 },
  statDivider: { width: 1, height: 56, backgroundColor: '#1e1e1e' },
  statMini: { fontSize: 9, fontWeight: '800', color: '#333', letterSpacing: 1 },
  statChip: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statIcon:  { fontSize: 18 },
  statLabel: { fontSize: 14, fontWeight: '800' },

  note: { fontSize: 11, color: '#2a2a2a', textAlign: 'center', lineHeight: 17 },
});
