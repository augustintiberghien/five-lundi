import { StyleSheet, Text, View } from 'react-native';

type Props = {
  size?: 'sm' | 'md' | 'lg';
};

const SIZES = {
  sm: { shield: 40, letter: 14, name: 10, gap: 4 },
  md: { shield: 64, letter: 22, name: 13, gap: 8 },
  lg: { shield: 88, letter: 30, name: 16, gap: 12 },
};

export default function Logo({ size = 'lg' }: Props) {
  const s = SIZES[size];

  return (
    <View style={styles.root}>
      {/* Shield mark */}
      <View style={[styles.shield, { width: s.shield, height: s.shield * 1.1 }]}>
        {/* Top golden bar */}
        <View style={styles.topBar} />
        {/* LR monogram */}
        <View style={styles.monogram}>
          <Text style={[styles.letter, { fontSize: s.letter }]}>LR</Text>
        </View>
        {/* Bottom point accent */}
        <View style={styles.bottomAccent} />
      </View>

      {/* Wordmark */}
      <View style={{ gap: 1, marginTop: s.gap }}>
        <Text style={[styles.name, { fontSize: s.name }]}>LOCKER ROOM</Text>
        <Text style={styles.tagline}>TON FIVE. TES STATS.</Text>
      </View>
    </View>
  );
}

const YELLOW = '#FFD600';
const BG = '#0d1117';

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    gap: 0,
  },

  shield: {
    borderRadius: 6,
    backgroundColor: YELLOW,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
    // Clipped bottom point via borderRadius trick
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
  },

  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 6,
    backgroundColor: BG,
    opacity: 0.25,
  },

  monogram: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  letter: {
    fontWeight: '900',
    color: BG,
    letterSpacing: 2,
    fontFamily: 'System',
  },

  bottomAccent: {
    position: 'absolute',
    bottom: 6,
    width: 20,
    height: 2,
    backgroundColor: BG,
    opacity: 0.3,
    borderRadius: 1,
  },

  name: {
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 3,
    textAlign: 'center',
    fontFamily: 'System',
  },

  tagline: {
    fontSize: 8,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.3)',
    letterSpacing: 2.5,
    textAlign: 'center',
  },
});
