import * as ImagePicker from 'expo-image-picker';
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
import { Criterion, OnboardingProfile, Position, Role } from '../store/useOnboarding';
import { CRITERIA_META, usePlayerRatings } from '../store/usePlayerRatings';
import { getInitials, scoreColor } from '../utils/formatting';

type Props = {
  profile: OnboardingProfile;
  onSave: (p: OnboardingProfile) => void;
  onClose?: () => void;
};

const ROLE_LABELS: Record<Role, { label: string; icon: string; color: string }> = {
  coach:  { label: 'Coach',  icon: '🎯', color: '#FF9800' },
  player: { label: 'Joueur', icon: '👟', color: '#4CAF50' },
};

const POSITION_LABELS: Record<Position, { label: string; icon: string }> = {
  GK:  { label: 'Gardien',   icon: '🧤' },
  DEF: { label: 'Défenseur', icon: '🛡️' },
  MIL: { label: 'Milieu',    icon: '🔄' },
  ATT: { label: 'Attaquant', icon: '⚡' },
};

// ─── Delta logic ──────────────────────────────────────────────────

type DeltaTag =
  | 'strength-confirmed'
  | 'strength-diverges'
  | 'weakness-confirmed'
  | 'weakness-diverges'
  | null;

function getDelta(
  crit: Criterion,
  score: number,
  strength: Criterion | undefined,
  weakness: Criterion | undefined
): DeltaTag {
  if (crit === strength) {
    if (score >= 14) return 'strength-confirmed';
    if (score <= 11) return 'strength-diverges';
  }
  if (crit === weakness) {
    if (score <= 12) return 'weakness-confirmed';
    if (score >= 15) return 'weakness-diverges';
  }
  return null;
}

const DELTA_DISPLAY: Record<Exclude<DeltaTag, null>, { label: string; color: string; icon: string }> = {
  'strength-confirmed': { label: 'Force confirmée par le coach',   color: '#4CAF50', icon: '✓' },
  'strength-diverges':  { label: 'Le coach voit autrement',        color: '#FF9800', icon: '⚠' },
  'weakness-confirmed': { label: 'Faiblesse reconnue',             color: '#888',    icon: '✓' },
  'weakness-diverges':  { label: 'Tu es meilleur que tu crois !',  color: '#64B5F6', icon: '↑' },
};

function scoreBar(v: number): string {
  const filled = Math.round((v / 20) * 8);
  return '█'.repeat(filled) + '░'.repeat(8 - filled);
}

// ─── Screen ───────────────────────────────────────────────────────

async function pickPhoto(): Promise<string | undefined> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return undefined;
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
  });
  if (!result.canceled && result.assets[0]) return result.assets[0].uri;
  return undefined;
}

export default function ProfileScreen({ profile, onSave, onClose = undefined }: Props) {
  const [editing, setEditing] = useState(false);

  async function changePhoto() {
    const uri = await pickPhoto();
    if (uri) onSave({ ...profile, photoUri: uri });
  }
  const { ratings } = usePlayerRatings();
  const coachRatings = ratings[profile.name];

  if (editing) {
    return (
      <OnboardingScreen
        initial={profile}
        onDone={(p) => { onSave(p); setEditing(false); }}
      />
    );
  }

  const initials = getInitials(profile.name);
  const pos  = profile.position ? POSITION_LABELS[profile.position] : null;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        {onClose ? (
          <TouchableOpacity style={styles.headerBtn} onPress={onClose}>
            <Text style={styles.headerBtnText}>←</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.headerBtn} />
        )}
        <Text style={styles.headerTitle}>Mon profil</Text>
        <TouchableOpacity style={styles.headerBtn} onPress={() => setEditing(true)}>
          <Text style={styles.editBtnText}>Modifier</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Avatar + name */}
        <View style={styles.hero}>
          <TouchableOpacity onPress={changePhoto} style={styles.avatarWrap} activeOpacity={0.8}>
            {profile.photoUri ? (
              <Image source={{ uri: profile.photoUri }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarInitials}>
                <Text style={styles.avatarInitialsText}>{initials}</Text>
              </View>
            )}
            <View style={styles.cameraBadge}>
              <Text style={styles.cameraBadgeIcon}>📷</Text>
            </View>
          </TouchableOpacity>
          <Text style={styles.heroName}>{profile.name}</Text>

          {/* Role badge */}
          {(() => {
            const r = ROLE_LABELS[profile.role];
            return (
              <View style={[styles.roleBadge, { borderColor: r.color + '55' }]}>
                <Text style={styles.roleBadgeIcon}>{r.icon}</Text>
                <Text style={[styles.roleBadgeText, { color: r.color }]}>{r.label}</Text>
              </View>
            );
          })()}

          {profile.bio ? (
            <Text style={styles.heroBio}>{profile.bio}</Text>
          ) : (
            <TouchableOpacity onPress={() => setEditing(true)}>
              <Text style={styles.addBio}>+ Ajouter une bio</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Position — player only */}
        {profile.role === 'player' && pos && (
          <>
            <Text style={styles.sectionLabel}>POSITION</Text>
            <View style={styles.card}>
              <View style={styles.posRow}>
                <Text style={styles.posIcon}>{pos.icon}</Text>
                <Text style={styles.posLabel}>{pos.label}</Text>
              </View>
            </View>
          </>
        )}

        {/* Auto-déclaratif — player only */}
        {profile.role === 'player' && (
          <>
            <Text style={styles.sectionLabel}>TON AUTO-ÉVALUATION</Text>
            <View style={styles.card}>
              <View style={styles.selfRow}>
                <View style={styles.selfBlock}>
                  <Text style={styles.selfMini}>🟢 MA FORCE</Text>
                  <View style={styles.selfChip}>
                    <Text style={styles.selfIcon}>
                      {CRITERIA_META.find(c => c.key === profile.strength)?.icon}
                    </Text>
                    <Text style={[styles.selfLabel, { color: '#4CAF50' }]}>
                      {CRITERIA_META.find(c => c.key === profile.strength)?.label}
                    </Text>
                  </View>
                </View>
                <View style={styles.selfDivider} />
                <View style={styles.selfBlock}>
                  <Text style={styles.selfMini}>🔴 MA FAIBLESSE</Text>
                  <View style={styles.selfChip}>
                    <Text style={styles.selfIcon}>
                      {CRITERIA_META.find(c => c.key === profile.weakness)?.icon}
                    </Text>
                    <Text style={[styles.selfLabel, { color: '#F44336' }]}>
                      {CRITERIA_META.find(c => c.key === profile.weakness)?.label}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </>
        )}

        {/* Coach evaluation + delta — player only */}
        {profile.role === 'player' && (
          <>
            <Text style={styles.sectionLabel}>ÉVALUATION COACH</Text>
            {coachRatings ? (
              <View style={styles.card}>
                {CRITERIA_META.map(c => {
                  const v     = coachRatings[c.key];
                  const color = scoreColor(v);
                  const delta = getDelta(c.key, v, profile.strength, profile.weakness);
                  const tag   = delta ? DELTA_DISPLAY[delta] : null;

                  return (
                    <View key={c.key} style={styles.evalRow}>
                      <Text style={styles.evalIcon}>{c.icon}</Text>
                      <Text style={styles.evalLabel}>{c.label}</Text>
                      <Text style={[styles.evalBar, { color }]}>{scoreBar(v)}</Text>
                      <Text style={[styles.evalScore, { color }]}>{v}</Text>
                      {tag && (
                        <View style={[styles.deltaTag, { borderColor: tag.color + '55' }]}>
                          <Text style={[styles.deltaIcon, { color: tag.color }]}>{tag.icon}</Text>
                        </View>
                      )}
                    </View>
                  );
                })}

                <View style={styles.legend}>
                  {Object.entries(DELTA_DISPLAY).map(([key, d]) => (
                    <View key={key} style={styles.legendRow}>
                      <Text style={[styles.legendIcon, { color: d.color }]}>{d.icon}</Text>
                      <Text style={styles.legendText}>{d.label}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : (
              <View style={styles.card}>
                <View style={styles.pendingBox}>
                  <Text style={styles.pendingIcon}>📊</Text>
                  <Text style={styles.pendingText}>En attente de notation</Text>
                  <Text style={styles.pendingSub}>
                    Le coach n'a pas encore renseigné tes critères.
                    {'\n'}Ils apparaîtront ici une fois la notation faite.
                  </Text>
                </View>
              </View>
            )}
          </>
        )}

        <Text style={styles.note}>
          {profile.role === 'coach'
            ? 'Ton profil est visible par les joueurs de ton groupe.'
            : 'Ces informations aident à équilibrer les équipes.\nElles sont visibles uniquement au sein de ton groupe.'}
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
  avatar: { width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: AVATAR_SIZE / 2 },
  avatarInitials: {
    width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: AVATAR_SIZE / 2,
    backgroundColor: '#1a1a1a', borderWidth: 1.5, borderColor: '#2a2a2a',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarInitialsText: { fontSize: 32, fontWeight: '900', color: '#555' },
  avatarWrap: { position: 'relative', marginBottom: 14 },
  cameraBadge: {
    position: 'absolute', bottom: 0, right: 0,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#1a1a1a', borderWidth: 1.5, borderColor: '#2a2a2a',
    alignItems: 'center', justifyContent: 'center',
  },
  cameraBadgeIcon: { fontSize: 13 },
  heroName: { fontSize: 24, fontWeight: '900', color: '#fff', marginBottom: 8 },
  roleBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderWidth: 1, borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4, marginBottom: 10,
  },
  roleBadgeIcon: { fontSize: 12 },
  roleBadgeText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  heroBio:  { fontSize: 13, color: '#555', textAlign: 'center', lineHeight: 19, maxWidth: 280 },
  addBio:   { fontSize: 13, color: '#333', fontWeight: '600' },

  sectionLabel: { fontSize: 10, fontWeight: '800', color: '#333', letterSpacing: 1.5, marginBottom: 10 },

  card: {
    backgroundColor: '#111', borderRadius: 14,
    borderWidth: 1, borderColor: '#1e1e1e',
    padding: 16, marginBottom: 20,
  },

  // Position
  posRow:   { flexDirection: 'row', alignItems: 'center', gap: 12 },
  posIcon:  { fontSize: 28 },
  posLabel: { fontSize: 18, fontWeight: '800', color: '#fff' },

  // Self-assessment
  selfRow:    { flexDirection: 'row', alignItems: 'center' },
  selfBlock:  { flex: 1, alignItems: 'center', gap: 8, paddingVertical: 6 },
  selfDivider:{ width: 1, height: 56, backgroundColor: '#1e1e1e' },
  selfMini:   { fontSize: 9, fontWeight: '800', color: '#333', letterSpacing: 1 },
  selfChip:   { flexDirection: 'row', alignItems: 'center', gap: 6 },
  selfIcon:   { fontSize: 18 },
  selfLabel:  { fontSize: 14, fontWeight: '800' },

  // Coach eval rows
  evalRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 6,
    borderBottomWidth: 1, borderBottomColor: '#0e0e0e',
  },
  evalIcon:  { fontSize: 14, width: 20 },
  evalLabel: { fontSize: 11, fontWeight: '700', color: '#666', width: 72 },
  evalBar:   { fontSize: 9, flex: 1, letterSpacing: -0.5 },
  evalScore: { fontSize: 13, fontWeight: '900', width: 24, textAlign: 'right' },
  deltaTag: {
    width: 22, height: 22, borderRadius: 6,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
  },
  deltaIcon: { fontSize: 11, fontWeight: '900' },

  // Legend
  legend: { marginTop: 14, gap: 5 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendIcon: { fontSize: 11, fontWeight: '900', width: 14, textAlign: 'center' },
  legendText: { fontSize: 10, color: '#333' },

  // Pending
  pendingBox: { alignItems: 'center', paddingVertical: 20, gap: 8 },
  pendingIcon: { fontSize: 32 },
  pendingText: { fontSize: 14, fontWeight: '700', color: '#555' },
  pendingSub:  { fontSize: 12, color: '#333', textAlign: 'center', lineHeight: 17 },

  note: { fontSize: 11, color: '#2a2a2a', textAlign: 'center', lineHeight: 17 },
});
