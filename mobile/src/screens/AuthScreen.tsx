import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../store/AuthContext';

export default function AuthScreen() {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);

  async function handleGoogle() {
    setError(null);
    setLoading(true);
    await signInWithGoogle();
    setLoading(false);
  }

  async function handleEmail() {
    if (!email.trim() || !password.trim()) {
      setError('Email et mot de passe requis.');
      return;
    }
    setError(null);
    setConfirmationSent(false);
    setLoading(true);
    if (mode === 'login') {
      const err = await signInWithEmail(email.trim(), password);
      setLoading(false);
      if (err) setError(err);
    } else {
      const { error: err, needsConfirmation } = await signUpWithEmail(email.trim(), password);
      setLoading(false);
      if (err) setError(err);
      else if (needsConfirmation) setConfirmationSent(true);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.inner}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Logo */}
        <View style={styles.logoSection}>
          <Text style={styles.logoIcon}>⚽</Text>
          <Text style={styles.logoName}>LOCKER ROOM</Text>
          <Text style={styles.logoSub}>Ton five. Tes stats.</Text>
        </View>

        {/* Google */}
        <TouchableOpacity style={styles.googleBtn} onPress={handleGoogle} disabled={loading}>
          <Text style={styles.googleIcon}>G</Text>
          <Text style={styles.googleText}>Continuer avec Google</Text>
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>ou</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Email form */}
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#333"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Mot de passe"
          placeholderTextColor="#333"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        {error && <Text style={styles.errorText}>{error}</Text>}
        {confirmationSent && (
          <Text style={styles.confirmText}>
            Un email de confirmation a été envoyé a {email}. Vérifie ta boite mail avant de te connecter.
          </Text>
        )}

        <TouchableOpacity style={styles.submitBtn} onPress={handleEmail} disabled={loading}>
          {loading
            ? <ActivityIndicator color="#0a0a0a" />
            : <Text style={styles.submitText}>
                {mode === 'login' ? 'Se connecter' : "Créer un compte"}
              </Text>
          }
        </TouchableOpacity>

        <Pressable onPress={() => { setMode(m => m === 'login' ? 'signup' : 'login'); setError(null); }}>
          <Text style={styles.toggleText}>
            {mode === 'login'
              ? "Pas encore inscrit ? Créer un compte"
              : "Déjà un compte ? Se connecter"}
          </Text>
        </Pressable>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  inner: { flex: 1, paddingHorizontal: 28, justifyContent: 'center' },

  logoSection: { alignItems: 'center', marginBottom: 48 },
  logoIcon: { fontSize: 48, marginBottom: 12 },
  logoName: { fontSize: 26, fontWeight: '900', color: '#fff', letterSpacing: 3 },
  logoSub: { fontSize: 13, color: '#444', marginTop: 6 },

  googleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#fff', borderRadius: 12,
    paddingVertical: 14, gap: 10, marginBottom: 20,
  },
  googleIcon: { fontSize: 18, fontWeight: '900', color: '#ea4335' },
  googleText: { fontSize: 15, fontWeight: '700', color: '#111' },

  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#1e1e1e' },
  dividerText: { fontSize: 12, color: '#333' },

  input: {
    backgroundColor: '#111', borderRadius: 12,
    borderWidth: 1, borderColor: '#1e1e1e',
    color: '#fff', fontSize: 15,
    paddingHorizontal: 16, paddingVertical: 14,
    marginBottom: 12,
  },

  errorText: { fontSize: 12, color: '#F44336', marginBottom: 8, textAlign: 'center' },
  confirmText: { fontSize: 13, color: '#4CAF50', marginBottom: 8, textAlign: 'center', lineHeight: 18 },

  submitBtn: {
    backgroundColor: '#4CAF50', borderRadius: 12,
    paddingVertical: 15, alignItems: 'center',
    marginBottom: 20, marginTop: 4,
  },
  submitText: { fontSize: 15, fontWeight: '800', color: '#0a0a0a' },

  toggleText: { textAlign: 'center', fontSize: 13, color: '#444' },
});
