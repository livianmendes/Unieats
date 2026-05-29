import { Link, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/src/components/Button';
import { Input } from '@/src/components/Input';
import { LogoUniEats } from '@/src/components/LogoUniEats';
import { AuthRole, useAuth } from '@/src/context/auth-context';

const demoAccess = {
  comprador: {
    email: 'cliente@unieats.demo',
    password: '123456',
    title: 'Entrar como comprador',
    description: 'Comprar produtos, adicionar ao carrinho e reservar pedidos.',
  },
  vendedor: {
    email: 'livian@academico.ufgd',
    password: '123456',
    title: 'Entrar como vendedor',
    description: 'Cadastrar produtos, abrir/fechar loja e acompanhar pedidos.',
  },
};

export default function LoginScreen() {
  const router = useRouter();
  const { user, login, isLoading } = useAuth();
  const [role, setRole] = useState<AuthRole>('comprador');
  const [email, setEmail] = useState(demoAccess.comprador.email);
  const [password, setPassword] = useState(demoAccess.comprador.password);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isLoading && user) {
      router.replace('/(tabs)');
    }
  }, [isLoading, router, user]);

  function selectRole(nextRole: AuthRole) {
    setRole(nextRole);
    setEmail(demoAccess[nextRole].email);
    setPassword(demoAccess[nextRole].password);
    setError('');
  }

  async function handleLogin() {
    setError('');

    if (!email.trim() || !password) {
      setError('Informe e-mail e senha.');
      return;
    }

    if (role === 'vendedor' && !/@academico\.ufgd$/i.test(email.trim())) {
      setError('Vendedores precisam usar e-mail institucional @academico.ufgd.');
      return;
    }

    try {
      setLoading(true);
      await login(email.trim(), password, role);
      router.replace('/(tabs)');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível entrar.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.logoWrap}>
            <LogoUniEats size="lg" />
            <Text style={styles.brand}>UNIEATS</Text>
            <Text style={styles.subtitle}>Encontre sua comida com um toque universitário</Text>
          </View>

          <View style={styles.roleGrid}>
            {(['comprador', 'vendedor'] as AuthRole[]).map((item) => (
              <Pressable
                key={item}
                style={[styles.roleCard, role === item && styles.roleCardActive]}
                onPress={() => selectRole(item)}>
                <Text style={[styles.roleTitle, role === item && styles.roleTitleActive]}>
                  {demoAccess[item].title}
                </Text>
                <Text style={[styles.roleDescription, role === item && styles.roleDescriptionActive]}>
                  {demoAccess[item].description}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.formCard}>
            <Text style={styles.formTitle}>
              {role === 'comprador' ? 'Acesso do comprador' : 'Acesso institucional do vendedor'}
            </Text>
            <Text style={styles.formHint}>
              {role === 'comprador'
                ? 'Use qualquer e-mail cadastrado para fazer pedidos.'
                : 'Vendedores entram com e-mail acadêmico @academico.ufgd.'}
            </Text>

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
              placeholder="Digite sua senha"
              secureTextEntry
              icon="lock.fill"
            />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <Button
              title={role === 'comprador' ? 'Entrar como comprador' : 'Entrar como vendedor'}
              fullWidth
              loading={loading}
              onPress={handleLogin}
            />

            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Não tem conta?</Text>
              <Link href="/cadastro" style={styles.link}>Criar cadastro</Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAD8D8',
  },
  keyboard: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    gap: 18,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    padding: 20,
    paddingBottom: 34,
  },
  logoWrap: {
    alignItems: 'center',
    gap: 8,
  },
  brand: {
    fontSize: 24,
    fontWeight: '900',
    color: '#D82020',
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '800',
    color: '#1A1111',
  },
  roleGrid: {
    gap: 10,
  },
  roleCard: {
    gap: 6,
    padding: 16,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: '#FFFFFF',
  },
  roleCardActive: {
    borderColor: '#050505',
    backgroundColor: '#050505',
  },
  roleTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#050505',
  },
  roleTitleActive: {
    color: '#FFFFFF',
  },
  roleDescription: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '700',
    color: '#604848',
  },
  roleDescriptionActive: {
    color: '#FAD8D8',
  },
  formCard: {
    gap: 14,
    padding: 18,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#050505',
  },
  formHint: {
    marginTop: -6,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
    color: '#604848',
  },
  errorText: {
    color: '#B91C1C',
    fontWeight: '800',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  footerText: {
    color: '#604848',
    fontWeight: '700',
  },
  link: {
    color: '#050505',
    fontWeight: '900',
    textDecorationLine: 'underline',
  },
});
