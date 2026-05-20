import { View, StyleSheet } from 'react-native';

type Props = {
  width: number;
  height: number;
  children?: React.ReactNode;
};

export default function PitchField({ width, height, children }: Props) {
  const cw = width * 0.28;
  const cr = cw / 2;

  return (
    <View style={[styles.field, { width, height }]}>
      {/* Grass stripes */}
      {Array.from({ length: 8 }).map((_, i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: (height / 8) * i,
            height: height / 8,
            backgroundColor: i % 2 === 0 ? 'rgba(0,0,0,0.06)' : 'transparent',
          }}
        />
      ))}

      {/* Center line */}
      <View style={[styles.line, { top: height * 0.5, left: 0, right: 0, height: 1.5 }]} />

      {/* Center circle */}
      <View
        style={[
          styles.circle,
          {
            width: cw,
            height: cw,
            borderRadius: cr,
            top: height * 0.5 - cr,
            left: width * 0.5 - cr,
          },
        ]}
      />

      {/* Center dot */}
      <View
        style={[
          styles.centerDot,
          { top: height * 0.5 - 3, left: width * 0.5 - 3 },
        ]}
      />

      {/* Goal area top */}
      <View
        style={[
          styles.goalArea,
          { width: width * 0.42, height: height * 0.09, left: width * 0.29, top: 0 },
        ]}
      />

      {/* Goal area bottom */}
      <View
        style={[
          styles.goalArea,
          { width: width * 0.42, height: height * 0.09, left: width * 0.29, bottom: 0 },
        ]}
      />

      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    backgroundColor: '#2e7d32',
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.7)',
  },
  line: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  circle: {
    position: 'absolute',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.55)',
    backgroundColor: 'transparent',
  },
  centerDot: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  goalArea: {
    position: 'absolute',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.55)',
    backgroundColor: 'transparent',
  },
});
