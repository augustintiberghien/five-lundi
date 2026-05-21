import { StyleSheet, Text, View } from 'react-native';

type Props = {
  size?: 'sm' | 'md' | 'lg';
};

const YELLOW = '#FFD600';
const BG = '#0d1117';

// Three locker doors side by side — universally recognisable as a changing room
export default function Logo({ size = 'lg' }: Props) {
  const scale = size === 'lg' ? 1 : size === 'md' ? 0.7 : 0.5;
  const w = Math.round(28 * scale);   // locker width
  const h = Math.round(42 * scale);   // locker height
  const gap = Math.round(4 * scale);
  const r = Math.round(3 * scale);
  const handleW = Math.round(6 * scale);
  const handleH = Math.round(2 * scale);
  const ventH = Math.round(2 * scale);
  const nameSize = size === 'lg' ? 17 : size === 'md' ? 13 : 9;
  const tagSize = size === 'lg' ? 9 : size === 'md' ? 7 : 6;

  const locker = (highlighted: boolean) => (
    <View style={[
      styles.locker,
      {
        width: w, height: h, borderRadius: r,
        borderWidth: Math.max(1, Math.round(1.5 * scale)),
        borderColor: highlighted ? YELLOW : 'rgba(255,214,0,0.35)',
        backgroundColor: highlighted ? 'rgba(255,214,0,0.08)' : 'transparent',
      },
    ]}>
      {/* Ventilation slot */}
      <View style={[styles.vent, { width: w * 0.5, height: ventH, marginTop: Math.round(5 * scale), borderRadius: 1 }]} />
      {/* Handle */}
      <View style={[styles.handle, { width: handleW, height: handleH, borderRadius: handleH / 2, marginTop: 'auto', marginBottom: Math.round(7 * scale) }]} />
    </View>
  );

  return (
    <View style={styles.root}>
      {/* Three lockers */}
      <View style={[styles.row, { gap }]}>
        {locker(false)}
        {locker(true)}
        {locker(false)}
      </View>

      {/* Wordmark */}
      <View style={{ alignItems: 'center', marginTop: Math.round(10 * scale), gap: 2 }}>
        <Text style={[styles.name, { fontSize: nameSize }]}>VESTIAIRE</Text>
        <Text style={[styles.tagline, { fontSize: tagSize }]}>TON FIVE · TES STATS</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'flex-end' },
  locker: { alignItems: 'center' },
  vent: { backgroundColor: YELLOW, opacity: 0.5 },
  handle: { backgroundColor: YELLOW },
  name: {
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 4,
    textAlign: 'center',
  },
  tagline: {
    fontWeight: '600',
    color: 'rgba(255,255,255,0.28)',
    letterSpacing: 2,
    textAlign: 'center',
  },
});
