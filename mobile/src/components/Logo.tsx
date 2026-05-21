import { StyleSheet, Text, View } from 'react-native';

type Props = {
  size?: 'sm' | 'md' | 'lg';
};

const SIZES = {
  sm: { mark: 36, vSize: 16, name: 10, sub: 7, gap: 6 },
  md: { mark: 52, vSize: 24, name: 13, sub: 8, gap: 8 },
  lg: { mark: 72, vSize: 33, name: 17, sub: 9, gap: 12 },
};

const YELLOW = '#FFD600';

export default function Logo({ size = 'lg' }: Props) {
  const s = SIZES[size];

  return (
    <View style={styles.root}>
      {/* Mark — V made of two angled strokes */}
      <View style={[styles.mark, { width: s.mark, height: s.mark }]}>
        <View style={[
          styles.stroke,
          styles.strokeLeft,
          { width: s.mark * 0.22, height: s.mark * 0.62 },
        ]} />
        <View style={[
          styles.stroke,
          styles.strokeRight,
          { width: s.mark * 0.22, height: s.mark * 0.62 },
        ]} />
        <View style={[styles.topLine, { width: s.mark * 0.6 }]} />
      </View>

      {/* Wordmark */}
      <View style={{ alignItems: 'center', marginTop: s.gap, gap: 2 }}>
        <Text style={[styles.name, { fontSize: s.name }]}>VESTIAIRE</Text>
        <Text style={[styles.tagline, { fontSize: s.sub }]}>TON FIVE · TES STATS</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { alignItems: 'center' },
  mark: { alignItems: 'center', justifyContent: 'center', position: 'relative' },
  stroke: { position: 'absolute', backgroundColor: YELLOW, borderRadius: 3 },
  strokeLeft: { transform: [{ rotate: '-20deg' }], left: '18%', top: '10%' },
  strokeRight: { transform: [{ rotate: '20deg' }], right: '18%', top: '10%' },
  topLine: {
    position: 'absolute', top: '8%', height: 2,
    backgroundColor: YELLOW, opacity: 0.35, borderRadius: 1,
  },
  name: { fontWeight: '900', color: '#fff', letterSpacing: 4, textAlign: 'center' },
  tagline: { fontWeight: '600', color: 'rgba(255,255,255,0.28)', letterSpacing: 2, textAlign: 'center' },
});
