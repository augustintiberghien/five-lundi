import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useRef, useState } from 'react';
import {
  Animated,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootStackParamList } from '../navigation/RootNavigator';
import {
  Criterion,
  CRITERIA_META,
  defaultRatings,
  PlayerRatings,
  RatingsStore,
  usePlayerRatings,
} from '../store/usePlayerRatings';
import { PLAYER_STATS } from '../types/stats';
import { getInitials, pct, scoreColor } from '../utils/formatting';

type Props = NativeStackScreenProps<RootStackParamList, 'CoachRating'>;
type Mode = 'criterion' | 'summary' | 'player';

// Base player list + any extras added by coach
const BASE_PLAYERS = PLAYER_STATS.map(p => p.name);

// ─── Individual player rating ─────────────────────────────────────

function PlayerRatingView({
  playerName,
  ratings,
  onChange,
  onBack,
  isNew,
}: {
  playerName: string;
  ratings: PlayerRatings;
  onChange: (c: Criterion, v: number) => void;
  onBack: () => void;
  isNew?: boolean;
}) {
  const initials = getInitials(playerName);

  return (
    <View style={{ flex: 1 }}>
      {/* Player hero */}
      <View style={pvStyles.hero}>
        <View style={pvStyles.avatar}>
          <Text style={pvStyles.avatarText}>{initials}</Text>
        </View>
        <Text style={pvStyles.playerName}>{playerName}</Text>
        {isNew && <View style={pvStyles.newBadge}><Text style={pvStyles.newBadgeText}>NOUVEAU</Text></View>}
      </View>

      {/* 6 criterion sliders */}
      <ScrollView contentContainerStyle={pvStyles.scroll} showsVerticalScrollIndicator={false}>
        {CRITERIA_META.map(c => {
          const v = ratings[c.key];
          const color = scoreColor(v);
          return (
            <View key={c.key} style={pvStyles.critRow}>
              <View style={pvStyles.critLeft}>
                <Text style={pvStyles.critIcon}>{c.icon}</Text>
                <View>
                  <Text style={pvStyles.critLabel}>{c.label}</Text>
                  <Text style={pvStyles.critDesc}>{c.desc}</Text>
                </View>
              </View>
              <View style={pvStyles.sliderArea}>
                <ScoreSlider value={v} onChange={val => onChange(c.key, val)} color={color} />
                <View style={[pvStyles.scoreBadge, { borderColor: color + '66' }]}>
                  <Text style={[pvStyles.scoreNum, { color }]}>{v}</Text>
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>

      <View style={pvStyles.bottom}>
        <TouchableOpacity style={pvStyles.doneBtn} onPress={onBack}>
          <Text style={pvStyles.doneBtnText}>← Retour au résumé</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Summary grid ─────────────────────────────────────────────────

function SummaryGrid({
  draft,
  players,
  onEditCell,
  onEditPlayer,
  onAddPlayer,
  onSave,
}: {
  draft: RatingsStore;
  players: string[];
  onEditCell: (player: string, criterion: Criterion) => void;
  onEditPlayer: (player: string) => void;
  onAddPlayer: () => void;
  onSave: () => void;
}) {
  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.summaryContent}>
      <View style={styles.summaryHeaderRow}>
        <Text style={styles.summaryTitle}>RÉSUMÉ</Text>
        <TouchableOpacity style={styles.addPlayerBtn} onPress={onAddPlayer}>
          <Text style={styles.addPlayerBtnText}>＋ Nouveau joueur</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.summarySub}>Tap nom → noter le joueur · Tap cellule → modifier une note</Text>

      {/* Column headers */}
      <View style={styles.gridRow}>
        <View style={styles.gridNameCell} />
        {CRITERIA_META.map(c => (
          <View key={c.key} style={styles.gridHeaderCell}>
            <Text style={styles.gridHeaderIcon}>{c.icon}</Text>
          </View>
        ))}
      </View>

      {/* Player rows */}
      {players.map(name => {
        const r = draft[name] ?? defaultRatings();
        const isRated = !!draft[name];
        return (
          <View key={name} style={styles.gridRow}>
            <TouchableOpacity style={styles.gridNameBtn} onPress={() => onEditPlayer(name)}>
              <Text style={[styles.gridName, !isRated && styles.gridNameUnrated]} numberOfLines={1}>
                {name}
              </Text>
            </TouchableOpacity>
            {CRITERIA_META.map(c => {
              const v = r[c.key];
              return (
                <TouchableOpacity
                  key={c.key}
                  style={[styles.gridCell, { backgroundColor: scoreColor(v) + '33' }]}
                  onPress={() => onEditCell(name, c.key)}
                >
                  <Text style={[styles.gridVal, { color: scoreColor(v) }]}>{v}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        );
      })}

      <TouchableOpacity style={styles.saveBtn} onPress={onSave}>
        <Text style={styles.saveBtnText}>Enregistrer ✓</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ─── Add player modal ─────────────────────────────────────────────

function AddPlayerView({
  onAdd,
  onCancel,
  existingNames,
}: {
  onAdd: (name: string) => void;
  onCancel: () => void;
  existingNames: string[];
}) {
  const [name, setName] = useState('');
  const trimmed = name.trim();
  const exists  = existingNames.some(n => n.toLowerCase() === trimmed.toLowerCase());

  return (
    <View style={addStyles.container}>
      <Text style={addStyles.title}>Nouveau joueur</Text>
      <Text style={addStyles.sub}>Entre son prénom — il sera noté sur les 6 critères</Text>

      <TextInput
        style={[addStyles.input, exists && addStyles.inputError]}
        value={name}
        onChangeText={setName}
        placeholder="Prénom Nom"
        placeholderTextColor="#2a2a2a"
        autoFocus
        autoCapitalize="words"
        maxLength={30}
      />
      {exists && <Text style={addStyles.errorText}>Ce joueur existe déjà</Text>}

      <View style={addStyles.btnRow}>
        <TouchableOpacity style={addStyles.cancelBtn} onPress={onCancel}>
          <Text style={addStyles.cancelText}>Annuler</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[addStyles.addBtn, (!trimmed || exists) && addStyles.addBtnOff]}
          onPress={() => trimmed && !exists && onAdd(trimmed)}
        >
          <Text style={addStyles.addBtnText}>Ajouter →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────

export default function CoachRatingScreen({ navigation }: Props) {
  const { ratings: saved, saveRatings } = usePlayerRatings();

  const [players, setPlayers] = useState<string[]>(() => {
    const extra = Object.keys(saved).filter(n => !BASE_PLAYERS.includes(n));
    return [...BASE_PLAYERS, ...extra];
  });

  const [draft, setDraft] = useState<RatingsStore>(() => {
    const d: RatingsStore = {};
    for (const p of players) d[p] = saved[p] ? { ...saved[p] } : defaultRatings();
    return d;
  });

  const [mode, setMode]           = useState<Mode>('criterion');
  const [critIdx, setCritIdx]     = useState(0);
  const [focusPlayer, setFocus]   = useState<string | null>(null);
  const [isNewPlayer, setIsNew]   = useState(false);
  const [showAdd, setShowAdd]     = useState(false);

  const fadeAnim  = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  function setScore(player: string, criterion: Criterion, value: number) {
    setDraft(prev => ({
      ...prev,
      [player]: { ...(prev[player] ?? defaultRatings()), [criterion]: value },
    }));
  }

  function setAll(value: number) {
    const crit = CRITERIA_META[critIdx].key;
    setDraft(prev => {
      const next = { ...prev };
      for (const p of players) next[p] = { ...(next[p] ?? defaultRatings()), [crit]: value };
      return next;
    });
  }

  function animateCrit(nextIdx: number) {
    const dir = nextIdx > critIdx ? -1 : 1;
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 0, duration: 120, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: dir * 40, duration: 120, useNativeDriver: true }),
    ]).start(() => {
      setCritIdx(nextIdx);
      slideAnim.setValue(-dir * 40);
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 1, duration: 180, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, friction: 8, useNativeDriver: true }),
      ]).start();
    });
  }

  function openPlayer(name: string, isNew = false) {
    setFocus(name);
    setIsNew(isNew);
    setMode('player');
  }

  function handleAddPlayer(name: string) {
    setPlayers(prev => [...prev, name]);
    setDraft(prev => ({ ...prev, [name]: defaultRatings() }));
    setShowAdd(false);
    openPlayer(name, true);
  }

  async function handleSave() {
    await saveRatings(draft);
    navigation.goBack();
  }

  const crit   = CRITERIA_META[critIdx];
  const isLast = critIdx === CRITERIA_META.length - 1;

  // Sort by score on current criterion — updates live as the coach drags
  const sortedPlayers = [...players].sort((a, b) => {
    const va = draft[a]?.[crit.key] ?? 12;
    const vb = draft[b]?.[crit.key] ?? 12;
    return vb - va;
  });

  // ── Add player overlay ──
  if (showAdd) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => setShowAdd(false)}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>NOTATION COACH</Text>
          <View style={styles.headerBtn} />
        </View>
        <AddPlayerView
          onAdd={handleAddPlayer}
          onCancel={() => setShowAdd(false)}
          existingNames={players}
        />
      </SafeAreaView>
    );
  }

  // ── Individual player view ──
  if (mode === 'player' && focusPlayer) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => setMode('summary')}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>NOTATION COACH</Text>
          <View style={styles.headerBtn} />
        </View>
        <PlayerRatingView
          playerName={focusPlayer}
          ratings={draft[focusPlayer] ?? defaultRatings()}
          onChange={(c, v) => setScore(focusPlayer, c, v)}
          onBack={() => setMode('summary')}
          isNew={isNewPlayer}
        />
      </SafeAreaView>
    );
  }

  // ── Summary ──
  if (mode === 'summary') {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => setMode('criterion')}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>NOTATION COACH</Text>
          <View style={styles.headerBtn} />
        </View>
        <SummaryGrid
          draft={draft}
          players={players}
          onEditCell={(player, criterion) => {
            const idx = CRITERIA_META.findIndex(c => c.key === criterion);
            if (idx >= 0) { setCritIdx(idx); setMode('criterion'); }
          }}
          onEditPlayer={name => openPlayer(name)}
          onAddPlayer={() => setShowAdd(true)}
          onSave={handleSave}
        />
      </SafeAreaView>
    );
  }

  // ── Criterion carousel (default) ──
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => critIdx === 0 ? navigation.goBack() : animateCrit(critIdx - 1)}
        >
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>NOTATION COACH</Text>
        <TouchableOpacity style={styles.headerBtn} onPress={() => setMode('summary')}>
          <Text style={styles.summaryLink}>Résumé</Text>
        </TouchableOpacity>
      </View>

      {/* Progress dots */}
      <View style={styles.dotsRow}>
        {CRITERIA_META.map((c, i) => (
          <TouchableOpacity key={c.key} onPress={() => animateCrit(i)}>
            <View style={[styles.dot, i === critIdx && styles.dotActive, i < critIdx && styles.dotDone]} />
          </TouchableOpacity>
        ))}
      </View>

      {/* Criterion title */}
      <Animated.View style={[styles.critHeader, { opacity: fadeAnim, transform: [{ translateX: slideAnim }] }]}>
        <Text style={styles.critIcon}>{crit.icon}</Text>
        <View>
          <Text style={styles.critName}>{crit.label.toUpperCase()}</Text>
          <Text style={styles.critDesc}>{crit.desc}</Text>
        </View>
      </Animated.View>

      {/* Player sliders */}
      <Animated.ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        // @ts-ignore — Animated.ScrollView opacity works at runtime
        opacity={fadeAnim}
      >
        {sortedPlayers.map((player, idx) => {
          const value = draft[player]?.[crit.key] ?? 12;
          return (
            <PlayerRow
              key={player}
              name={player}
              value={value}
              rank={idx + 1}
              onChange={v => setScore(player, crit.key, v)}
              onNamePress={() => openPlayer(player)}
            />
          );
        })}
      </Animated.ScrollView>

      {/* Bottom bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.resetBtn} onPress={() => setAll(12)}>
          <Text style={styles.resetBtnText}>Tout à 12</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.nextBtn}
          onPress={() => isLast ? setMode('summary') : animateCrit(critIdx + 1)}
        >
          <Text style={styles.nextBtnText}>
            {isLast
              ? 'Résumé →'
              : `${CRITERIA_META[critIdx + 1].icon} ${CRITERIA_META[critIdx + 1].label} →`}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── PlayerRow ────────────────────────────────────────────────────

function PlayerRow({
  name, value, rank, onChange, onNamePress,
}: {
  name: string; value: number; rank?: number;
  onChange: (v: number) => void; onNamePress: () => void;
}) {
  const color = scoreColor(value);
  return (
    <View style={styles.playerRow}>
      {rank !== undefined && (
        <Text style={[styles.rankNum, rank === 1 && styles.rankFirst]}>{rank}</Text>
      )}
      <TouchableOpacity onPress={onNamePress} hitSlop={{ top: 8, bottom: 8, left: 0, right: 0 }}>
        <Text style={styles.playerName} numberOfLines={1}>{name}</Text>
      </TouchableOpacity>
      <ScoreSlider value={value} onChange={onChange} color={color} />
      <View style={[styles.scoreBadge, { borderColor: color + '66' }]}>
        <Text style={[styles.scoreNum, { color }]}>{value}</Text>
      </View>
    </View>
  );
}

// ─── ScoreSlider ──────────────────────────────────────────────────

function ScoreSlider({
  value, onChange, color,
}: {
  value: number; onChange: (v: number) => void; color: string;
}) {
  const trackWidthRef = useRef(1);
  const grantXRef     = useRef(0);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder:  () => true,
      onPanResponderGrant: (e) => {
        grantXRef.current = e.nativeEvent.locationX;
        const pct = grantXRef.current / trackWidthRef.current;
        onChange(Math.round(Math.max(0, Math.min(20, pct * 20))));
      },
      onPanResponderMove: (_, gs) => {
        const pct = (grantXRef.current + gs.dx) / trackWidthRef.current;
        onChange(Math.round(Math.max(0, Math.min(20, pct * 20))));
      },
    })
  ).current;

  const fillPct = pct((value / 20) * 100);

  return (
    <View
      style={styles.track}
      onLayout={e => { trackWidthRef.current = e.nativeEvent.layout.width; }}
      {...panResponder.panHandlers}
    >
      <View style={[styles.trackFill, { width: fillPct, backgroundColor: color }]} />
      <View style={[styles.thumb, { left: fillPct, borderColor: color }]} />
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
  headerBtn:   { width: 64 },
  backArrow:   { fontSize: 22, color: '#fff' },
  summaryLink: { fontSize: 12, color: '#4CAF50', fontWeight: '700', textAlign: 'right' },
  headerTitle: { fontSize: 13, fontWeight: '900', color: '#fff', letterSpacing: 1 },

  dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 10, paddingVertical: 14 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#1e1e1e', borderWidth: 1, borderColor: '#2a2a2a' },
  dotDone:   { backgroundColor: '#1e3a1e', borderColor: '#2e5c2e' },
  dotActive: { backgroundColor: '#4CAF50', borderColor: '#4CAF50', width: 28, borderRadius: 4 },

  critHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 20, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: '#111',
  },
  critIcon: { fontSize: 36 },
  critName: { fontSize: 18, fontWeight: '900', color: '#fff', letterSpacing: 1 },
  critDesc: { fontSize: 12, color: '#444', marginTop: 2 },

  listContent: { paddingHorizontal: 16, paddingVertical: 12, gap: 10 },

  playerRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#0e0e0e', borderRadius: 12,
    borderWidth: 1, borderColor: '#1a1a1a',
    paddingHorizontal: 12, paddingVertical: 10,
  },
  rankNum:   { width: 18, fontSize: 11, fontWeight: '800', color: '#333', textAlign: 'center' },
  rankFirst: { color: '#FFD700' },
  playerName: { width: 68, fontSize: 12, fontWeight: '700', color: '#aaa' },

  track: {
    flex: 1, height: 28, borderRadius: 14,
    backgroundColor: '#1a1a1a', justifyContent: 'center', overflow: 'visible',
  },
  trackFill: { position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: 14, opacity: 0.7 },
  thumb: {
    position: 'absolute', width: 22, height: 22, borderRadius: 11,
    backgroundColor: '#0a0a0a', borderWidth: 2.5, marginLeft: -11, top: 3, zIndex: 2,
  },

  scoreBadge: {
    width: 34, height: 34, borderRadius: 8,
    backgroundColor: '#111', borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  scoreNum: { fontSize: 13, fontWeight: '900' },

  bottomBar: {
    flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: '#1a1a1a',
  },
  resetBtn: {
    paddingHorizontal: 16, paddingVertical: 13,
    borderRadius: 12, borderWidth: 1, borderColor: '#2a2a2a', backgroundColor: '#111',
  },
  resetBtnText: { fontSize: 12, color: '#555', fontWeight: '700' },
  nextBtn: { flex: 1, backgroundColor: '#4CAF50', borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  nextBtnText: { fontSize: 13, fontWeight: '800', color: '#fff' },

  // Summary
  summaryContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 },
  summaryHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  summaryTitle: { fontSize: 12, fontWeight: '900', color: '#fff', letterSpacing: 2 },
  summarySub:   { fontSize: 11, color: '#333', marginBottom: 16 },
  addPlayerBtn: {
    backgroundColor: '#0d1a0d', borderWidth: 1, borderColor: '#4CAF50',
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5,
  },
  addPlayerBtnText: { fontSize: 11, color: '#4CAF50', fontWeight: '700' },

  gridRow:        { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  gridNameCell:   { width: 80 },
  gridHeaderCell: { width: 36, alignItems: 'center' },
  gridHeaderIcon: { fontSize: 15 },
  gridNameBtn:    { width: 80 },
  gridName:       { fontSize: 11, fontWeight: '700', color: '#aaa' },
  gridNameUnrated:{ color: '#333' },
  gridCell: {
    width: 36, height: 28, borderRadius: 6,
    alignItems: 'center', justifyContent: 'center', marginHorizontal: 1,
  },
  gridVal: { fontSize: 11, fontWeight: '900' },

  saveBtn: { marginTop: 24, backgroundColor: '#4CAF50', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  saveBtnText: { fontSize: 15, fontWeight: '900', color: '#fff' },
});

// ─── Per-player styles ────────────────────────────────────────────

const pvStyles = StyleSheet.create({
  hero: { alignItems: 'center', paddingVertical: 20 },
  avatar: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: '#1a1a1a', borderWidth: 1.5, borderColor: '#2a2a2a',
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  avatarText: { fontSize: 20, fontWeight: '900', color: '#555' },
  playerName: { fontSize: 20, fontWeight: '900', color: '#fff' },
  newBadge: {
    marginTop: 4, backgroundColor: 'rgba(76,175,80,0.15)',
    borderWidth: 1, borderColor: '#4CAF50',
    borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2,
  },
  newBadgeText: { fontSize: 10, color: '#4CAF50', fontWeight: '800', letterSpacing: 1 },

  scroll: { paddingHorizontal: 16, paddingBottom: 24, gap: 10 },

  critRow: {
    backgroundColor: '#0e0e0e', borderRadius: 14,
    borderWidth: 1, borderColor: '#1a1a1a',
    padding: 14, gap: 12,
  },
  critLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  critIcon:  { fontSize: 22 },
  critLabel: { fontSize: 13, fontWeight: '800', color: '#ddd' },
  critDesc:  { fontSize: 11, color: '#444', marginTop: 1 },
  sliderArea: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  scoreBadge: {
    width: 34, height: 34, borderRadius: 8,
    backgroundColor: '#111', borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  scoreNum: { fontSize: 13, fontWeight: '900' },

  bottom: { paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#1a1a1a' },
  doneBtn: {
    backgroundColor: '#111', borderRadius: 12, borderWidth: 1, borderColor: '#2a2a2a',
    paddingVertical: 13, alignItems: 'center',
  },
  doneBtnText: { fontSize: 13, color: '#555', fontWeight: '700' },
});

// ─── Add player styles ────────────────────────────────────────────

const addStyles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 32 },
  title:    { fontSize: 24, fontWeight: '900', color: '#fff', marginBottom: 6 },
  sub:      { fontSize: 13, color: '#444', marginBottom: 28, lineHeight: 18 },
  input: {
    backgroundColor: '#111', borderRadius: 14,
    borderWidth: 1, borderColor: '#1e1e1e',
    paddingHorizontal: 18, paddingVertical: 16,
    fontSize: 20, color: '#fff', fontWeight: '700', marginBottom: 6,
  },
  inputError: { borderColor: '#F44336' },
  errorText:  { fontSize: 12, color: '#F44336', marginBottom: 12 },
  btnRow:   { flexDirection: 'row', gap: 10, marginTop: 12 },
  cancelBtn: {
    paddingHorizontal: 20, paddingVertical: 14,
    borderRadius: 12, borderWidth: 1, borderColor: '#2a2a2a',
  },
  cancelText: { fontSize: 13, color: '#555', fontWeight: '700' },
  addBtn: { flex: 1, backgroundColor: '#4CAF50', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  addBtnOff: { backgroundColor: '#1a1a1a' },
  addBtnText: { fontSize: 14, fontWeight: '800', color: '#fff' },
});
