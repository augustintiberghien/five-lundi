import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { useT } from '../i18n';
import { GROUP_CONFIG, isPast, Session, UserRegistration } from '../types/session';

type Props = {
  session: Session;
  registration: UserRegistration;
  onRegister?: () => void;
  onUnregister?: () => void;
  onVote?: () => void;
  onPress?: () => void;
};

export default function SessionCard({
  session,
  registration,
  onRegister,
  onUnregister,
  onVote,
  onPress,
}: Props) {
  const past = isPast(session);
  const t = useT();
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!past && session.inscriptionsOpen && registration.status === 'none') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.15, duration: 800, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      ).start();
    }
    return () => pulse.stopAnimation();
  }, [session.inscriptionsOpen, registration.status, past, pulse]);

  const cardContent = (
    <View style={[styles.card, past && styles.cardPast, !!onPress && styles.cardTappable]}>
      {/* Date row */}
      <View style={styles.dateRow}>
        <View>
          <Text style={[styles.date, past && styles.datePast]}>
            {t.formatDate(session.date)}
          </Text>
          {(() => {
            const time = session.time ?? GROUP_CONFIG.defaultTime;
            const loc  = session.location ?? GROUP_CONFIG.defaultLocation;
            const meta = [time, loc].filter(Boolean).join(' · ');
            return meta ? <Text style={styles.dateMeta}>{meta}</Text> : null;
          })()}
        </View>
        {session.voteOpen && (
          <TouchableOpacity style={styles.voteBadge} onPress={onVote}>
            <Text style={styles.voteBadgeText}>{t.session.voteMvp}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Teams / Score */}
      {past ? (
        <PastScore session={session} />
      ) : (
        <Text style={styles.teams}>
          {session.nameA} <Text style={styles.vs}>vs</Text> {session.nameB}
        </Text>
      )}

      {/* Past: MVP */}
      {past && session.mvp && (
        <Text style={styles.mvp}>{t.session.mvp} — {session.mvp}</Text>
      )}

      {/* Future: inscription status */}
      {!past && (
        <InscriptionStatus
          session={session}
          registration={registration}
          pulse={pulse}
          onRegister={onRegister}
          onUnregister={onUnregister}
          t={t}
        />
      )}

      {/* Past: read article hint */}
      {past && session.article && (
        <Text style={styles.articleHint}>{t.session.articleHint}</Text>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableWithoutFeedback onPress={onPress}>
        {cardContent}
      </TouchableWithoutFeedback>
    );
  }
  return cardContent;
}

function PastScore({ session }: { session: Session }) {
  const aWon = session.scoreWinner === 'A';
  const bWon = session.scoreWinner === 'B';
  const [scoreA, scoreB] = session.score.split('–').map(s => s.trim());
  return (
    <View style={styles.scoreRow}>
      <Text style={[styles.scoreName, aWon && styles.scoreWinner]}>{session.nameA}</Text>
      <View style={styles.scoreBox}>
        <Text style={[styles.scoreNum, aWon && styles.scoreWinner]}>{scoreA}</Text>
        <Text style={styles.scoreSep}>–</Text>
        <Text style={[styles.scoreNum, bWon && styles.scoreWinner]}>{scoreB}</Text>
      </View>
      <Text style={[styles.scoreName, styles.scoreNameRight, bWon && styles.scoreWinner]}>
        {session.nameB}
      </Text>
    </View>
  );
}

type T = ReturnType<typeof useT>;

function InscriptionStatus({
  session,
  registration,
  pulse,
  onRegister,
  onUnregister,
  t,
}: {
  session: Session;
  registration: UserRegistration;
  pulse: Animated.Value;
  onRegister?: () => void;
  onUnregister?: () => void;
  t: T;
}) {
  const { status, benchPosition } = registration;
  const total = session.confirmedCount + session.benchCount;

  if (status === 'confirmed') {
    return (
      <View style={styles.statusRow}>
        <View style={[styles.statusBadge, styles.badgeGreen]}>
          <Text style={styles.statusText}>{t.session.confirmed}</Text>
        </View>
        <Text style={styles.countText}>{session.confirmedCount}/{session.maxPlayers}</Text>
        <TouchableOpacity onPress={onUnregister}>
          <Text style={styles.unregisterLink}>{t.session.leave}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (status === 'bench') {
    return (
      <View style={styles.statusRow}>
        <View style={[styles.statusBadge, styles.badgeAmber]}>
          <Text style={styles.statusText}>{t.session.benchLine(benchPosition ?? 1)}</Text>
        </View>
        <TouchableOpacity onPress={onUnregister}>
          <Text style={styles.unregisterLink}>{t.session.leave}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (status === 'absent') {
    return (
      <View style={styles.statusRow}>
        <View style={[styles.statusBadge, styles.badgeGrey]}>
          <Text style={styles.statusText}>{t.session.absent}</Text>
        </View>
        {session.inscriptionsOpen && (
          <TouchableOpacity style={styles.rejoinBtn} onPress={onRegister}>
            <Text style={styles.rejoinBtnText}>{t.session.rejoin} ({total}/{session.maxPlayers})</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // status === 'none'
  if (!session.inscriptionsOpen) {
    return (
      <View style={styles.statusRow}>
        <Text style={styles.closedText}>{t.session.inscriptionsSoon}</Text>
        <Text style={styles.countText}>{total} {t.session.inscribed}</Text>
      </View>
    );
  }

  return (
    <View style={styles.openRow}>
      <Animated.View style={[styles.dot, { transform: [{ scale: pulse }] }]} />
      <Text style={styles.openText}>{t.session.openLine(total, session.maxPlayers)}</Text>
      <TouchableOpacity style={styles.joinBtn} onPress={onRegister}>
        <Text style={styles.joinBtnText}>{t.session.join}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#141414',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#222',
  },
  cardPast: {
    opacity: 0.65,
  },
  cardTappable: {
    borderColor: '#2a2a2a',
  },
  articleHint: {
    fontSize: 11,
    color: '#444',
    marginTop: 8,
  },

  dateRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  date: { fontSize: 13, fontWeight: '700', color: '#fff', textTransform: 'capitalize' },
  datePast: { color: '#888' },
  dateMeta: { fontSize: 10, color: '#555', fontWeight: '500', marginTop: 1 },

  teams: { fontSize: 15, color: '#ddd', fontWeight: '600', marginBottom: 10 },
  vs: { color: '#555' },

  scoreRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  scoreName: { flex: 1, fontSize: 11, color: '#777', fontWeight: '600' },
  scoreNameRight: { textAlign: 'right' },
  scoreWinner: { color: '#fff' },
  scoreBox: { flexDirection: 'row', alignItems: 'center', gap: 6, marginHorizontal: 8 },
  scoreNum: { fontSize: 22, fontWeight: '800', color: '#555', width: 28, textAlign: 'center' },
  scoreSep: { fontSize: 18, color: '#444' },

  mvp: { fontSize: 12, color: '#f5c518', marginTop: 4 },

  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' },
  statusBadge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  badgeGreen: { backgroundColor: 'rgba(76, 175, 80, 0.2)', borderWidth: 1, borderColor: '#4CAF50' },
  badgeAmber: { backgroundColor: 'rgba(255, 160, 0, 0.15)', borderWidth: 1, borderColor: '#FFA000' },
  badgeGrey:  { backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#333' },
  statusText: { fontSize: 12, fontWeight: '600', color: '#eee' },

  countText: { fontSize: 12, color: '#555' },
  unregisterLink: { fontSize: 11, color: '#555', textDecorationLine: 'underline' },

  openRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4CAF50' },
  openText: { fontSize: 12, color: '#aaa', flex: 1 },
  joinBtn: { backgroundColor: '#4CAF50', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6 },
  joinBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },

  rejoinBtn: { backgroundColor: '#222', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: '#444' },
  rejoinBtnText: { fontSize: 12, color: '#aaa' },

  closedText: { fontSize: 12, color: '#444', flex: 1 },

  voteBadge: { backgroundColor: 'rgba(255,152,0,0.2)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3, borderWidth: 1, borderColor: '#FF9800' },
  voteBadgeText: { fontSize: 11, fontWeight: '700', color: '#FF9800' },
});
