import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    StyleSheet,
    View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Button } from '@/src/components/Button';
import { Input } from '@/src/components/Input';
import { LogoUniEats } from '@/src/components/LogoUniEats';
import { Colors } from '@/src/constants/theme';
import { useAuth } from '@/src/context/auth-context';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<'comprador' | 'vendedor'>('comprador');
  const [error, setError] = useState('');

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}> 
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.select({ ios: 90, android: 60, default: 0 })}>
        <ThemedView style={styles.container}>
          <LogoUniEats size="lg" />
          <ThemedText type="title" style={styles.title}>
            UniEats
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Escolha seu perfil. Vendedores precisam de e-mail @academico.ufgd.
          </ThemedText>

          <View style={styles.roleRow}>
            <Button
              title="Comprador"
              variant={role === 'comprador' ? 'primary' : 'secondary'}
              fullWidth
              onPress={() => setRole('comprador')}
              style={styles.roleButton}
            />
            <Button
              title="Vendedor"
              variant={role === 'vendedor' ? 'primary' : 'secondary'}
              fullWidth
              onPress={() => setRole('vendedor')}
              style={styles.roleButton}
            />
          </View>

          <Input
            label={role === 'vendedor' ? 'E-mail institucional' : 'E-mail'}
            value={email}
            onChangeText={setEmail}
            placeholder={role === 'vendedor' ? 'seu@academico.ufgd' : 'seu@email.com'}
            icon="envelope"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Input
            label="Senha"
            value={password}
            onChangeText={setPassword}
            placeholder="********"
            secureTextEntry={!showPassword}
            icon="lock.fill"
            rightIcon={showPassword ? 'eye.slash' : 'eye.fill'}
            onRightIconPress={() => setShowPassword((current) => !current)}
          />

          <View style={styles.forgotRow}>
            <Link href="/recuperar-senha" style={[styles.link, { color: theme.tint }]}>Esqueci minha senha</Link>
          </View>

          {error ? <ThemedText style={styles.errorText}>{error}</ThemedText> : null}
          <Button
            title={role === 'comprador' ? 'Entrar como Comprador' : 'Entrar como Vendedor'}
            fullWidth
            onPress={() => {
              setError('');
              if (role === 'vendedor' && !email.includes('@academico.ufgd')) {
                setError('Vendedores precisam usar e-mail institucional @academico.ufgd.');
                return;
              }
              login(email.trim(), role);
              router.replace('/(tabs)');
            }}
            style={styles.primaryButton}
          />

          <View style={styles.footerRow}>
            <ThemedText>Não tem conta?</ThemedText>
            <Link href="/cadastro" style={[styles.link, { color: theme.tint }]}>Criar conta</Link>
          </View>
        </ThemedView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    gap: 18,
  },
  title: {
    fontSize: 32,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 6,
  },
  smallText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
    marginBottom: 12,
  },
  roleRow: {
    flexDirection: 'row',
    gap: 10,
  },
  roleButton: {
    flex: 1,
  },
  forgotRow: {
    alignItems: 'flex-end',
  },
  link: {
    fontSize: 16,
    textDecorationLine: 'underline',
  },
  errorText: {
    color: '#EF4444',
    marginBottom: 8,
  },
  primaryButton: {
    marginTop: 8,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    alignItems: 'center',
  },
});
