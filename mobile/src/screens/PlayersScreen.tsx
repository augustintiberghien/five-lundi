import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useT } from '../i18n';
import { RootStackParamList } from '../navigation/RootNavigator';
import { FORM_COLOR, PLAYER_STATS } from '../types/stats';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function PlayersScreen() {
  const navigation = useNavigation<Nav>();
  const t = useT();

  const sorted = [...PLAYER_STATS].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t.stats.joueurs}</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {sorted.map(p => {
          const wr = Math.round((p.wins / p.played) * 100);
          const formColor = FORM_COLOR[p.form];
          return (
            <TouchableOpacity
              key={p.name}
              style={styles.row}
              onPress={() => navigation.navigate('Player', { playerName: p.name })}
              activeOpacity={0.7}
            >
              <View style={[styles.avatar, { borderColor: formColor }]}>
                <Text style={[styles.initials, { color: formColor }]}>
                  {p.name.slice(0, 2).toUpperCase()}
                </Text>
              </View>
              <View style={styles.info}>
                <Text style={styles.name}>{p.name}</Text>
                <Text style={[styles.form, { color: formColor }]}>{t.form[p.form]}</Text>
              </View>
              <View style={styles.statsGroup}>
                <Text style={styles.wr}>{wr}%</Text>
                <Text style={styles.played}>{p.played} {t.player.played.toLowerCase()}</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#1a1a1a',
  },
  backBtn: { width: 40 },
  backArrow: { fontSize: 22, color: '#fff' },
  title: { fontSize: 15, fontWeight: '800', color: '#fff' },

  scroll: { paddingBottom: 40 },

  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#111',
    gap: 14,
  },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#0d0d0d', borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  initials: { fontSize: 14, fontWeight: '800' },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '700', color: '#ddd', marginBottom: 3 },
  form: { fontSize: 11, fontWeight: '600' },
  statsGroup: { alignItems: 'flex-end', gap: 3 },
  wr: { fontSize: 15, fontWeight: '800', color: '#4CAF50' },
  played: { fontSize: 10, color: '#333', fontWeight: '600' },
  chevron: { fontSize: 20, color: '#2a2a2a', fontWeight: '300' },
});
