import { StyleSheet, Text, View } from 'react-native';

// Google G — cercle blanc avec le G en bleu Google, propre et reconnaissable
export default function GoogleG({ size = 22 }: { size?: number }) {
  return (
    <View style={[styles.wrap, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.letter, { fontSize: size * 0.68 }]}>G</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  letter: {
    fontWeight: '700',
    color: '#4285F4',
    includeFontPadding: false,
  },
});
