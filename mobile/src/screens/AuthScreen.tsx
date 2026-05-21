import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
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
import Logo from '../components/Logo';
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
          <Logo size="lg" />
        </View>

        {/* Google */}
        <TouchableOpacity style={styles.googleBtn} onPress={handleGoogle} disabled={loading}>
          <Image
            source={{ uri: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0OCA0OCIgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0Ij48cGF0aCBmaWxsPSIjRUE0MzM1IiBkPSJNMjQgOS41YzMuNTQgMCA2LjcxIDEuMjIgOS4yMSAzLjZsNi44NS02Ljg1QzM1LjkgMi4zOCAzMC40NyAwIDI0IDAgMTQuNjIgMCA2LjUxIDUuMzggMi41NiAxMy4yMmw3Ljk4IDYuMTlDMTIuNDMgMTMuNzIgMTcuNzQgOS41IDI0IDkuNXoiLz48cGF0aCBmaWxsPSIjNDI4NUY0IiBkPSJNNDYuOTggMjQuNTVjMC0xLjU3LS4xNS0zLjA5LS4zOC00LjU1SDI0djkuMDJoMTIuOTRjLS41OCAyLjk2LTIuMjYgNS40OC00Ljc4IDcuMThsNy43MyA2YzQuNTEtNC4xOCA3LjA5LTEwLjM2IDcuMDktMTcuNjV6Ii8+PHBhdGggZmlsbD0iI0ZCQkMwNSIgZD0iTTEwLjUzIDI4LjU5Yy0uNDgtMS40NS0uNzYtMi45OS0uNzYtNC41OXMuMjctMy4xNC43Ni00LjU5bC03Ljk4LTYuMTlDLjkyIDE2LjQ2IDAgMjAuMTIgMCAyNGMwIDMuODguOTIgNy41NCAyLjU2IDEwLjc4bDcuOTctNi4xOXoiLz48cGF0aCBmaWxsPSIjMzRBODUzIiBkPSJNMjQgNDhjNi40OCAwIDExLjkzLTIuMTMgMTUuODktNS44MWwtNy43My02Yy0yLjE1IDEuNDUtNC45MiAyLjMtOC4xNiAyLjMtNi4yNiAwLTExLjU3LTQuMjItMTMuNDctOS45MWwtNy45OCA2LjE5QzYuNTEgNDIuNjIgMTQuNjIgNDggMjQgNDh6Ii8+PC9zdmc+' }}
            style={styles.googleLogo}
          />
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
          placeholderTextColor="#3a4558"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Mot de passe"
          placeholderTextColor="#3a4558"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        {error && <Text style={styles.errorText}>{error}</Text>}
        {confirmationSent && (
          <Text style={styles.confirmText}>
            Un email de confirmation a été envoyé à {email}. Vérifie ta boite mail avant de te connecter.
          </Text>
        )}

        <TouchableOpacity style={styles.submitBtn} onPress={handleEmail} disabled={loading}>
          {loading
            ? <ActivityIndicator color="#0d1117" />
            : <Text style={styles.submitText}>
                {mode === 'login' ? 'Se connecter' : 'Créer un compte'}
              </Text>
          }
        </TouchableOpacity>

        <Pressable onPress={() => { setMode(m => m === 'login' ? 'signup' : 'login'); setError(null); }}>
          <Text style={styles.toggleText}>
            {mode === 'login'
              ? 'Pas encore inscrit ? Créer un compte'
              : 'Déjà un compte ? Se connecter'}
          </Text>
        </Pressable>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d1117' },
  inner: { flex: 1, paddingHorizontal: 28, justifyContent: 'center' },

  logoSection: { alignItems: 'center', marginBottom: 52 },

  googleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#fff', borderRadius: 10,
    paddingVertical: 14, gap: 10, marginBottom: 20,
  },
  googleLogo: { width: 20, height: 20 },
  googleText: { fontSize: 15, fontWeight: '700', color: '#111' },

  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#1c2333' },
  dividerText: { fontSize: 12, color: '#3a4558' },

  input: {
    backgroundColor: '#111827', borderRadius: 10,
    borderWidth: 1, borderColor: '#1e2a3a',
    color: '#e6eaf0', fontSize: 15,
    paddingHorizontal: 16, paddingVertical: 14,
    marginBottom: 12,
  },

  errorText: { fontSize: 12, color: '#ef4444', marginBottom: 8, textAlign: 'center' },
  confirmText: { fontSize: 13, color: '#FFD600', marginBottom: 8, textAlign: 'center', lineHeight: 18 },

  submitBtn: {
    backgroundColor: '#FFD600', borderRadius: 10,
    paddingVertical: 15, alignItems: 'center',
    marginBottom: 20, marginTop: 4,
  },
  submitText: { fontSize: 15, fontWeight: '800', color: '#0d1117' },

  toggleText: { textAlign: 'center', fontSize: 13, color: '#4a566e' },
});
