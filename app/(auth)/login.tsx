import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/src/components/Button';
import { Input } from '@/src/components/Input';
import { LogoUniEats } from '@/src/components/LogoUniEats';
import { AuthRole, useAuth } from '@/src/context/auth-context';

const roleAccess = {
  comprador: {
    title: 'Entrar como comprador',
    description: 'Comprar produtos, adicionar ao carrinho e reservar pedidos.',
  },
  vendedor: {
    title: 'Entrar como vendedor',
    description: 'Cadastrar produtos, abrir/fechar loja e acompanhar pedidos.',
  },
};

export default function LoginScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user, login, loginDemo, isLoading } = useAuth();
  const [role, setRole] = useState<AuthRole>('comprador');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState<AuthRole | null>(null);

  useEffect(() => {
    if (!isLoading && user) {
      router.replace('/(tabs)');
    }
  }, [isLoading, router, user]);

  useEffect(() => {
    const created = Array.isArray(params.created) ? params.created[0] : params.created;
    const nextEmail = Array.isArray(params.email) ? params.email[0] : params.email;
    const nextRole = Array.isArray(params.role) ? params.role[0] : params.role;

    if (nextRole === 'comprador' || nextRole === 'vendedor') {
      setRole(nextRole);
    }

    if (typeof nextEmail === 'string') {
      setEmail(nextEmail);
      setPassword('');
    }

    if (created === '1') {
      setNotice('Cadastro criado. Entre com sua senha para acessar o perfil.');
      setError('');
    }
  }, [params.created, params.email, params.role]);

  function selectRole(nextRole: AuthRole) {
    setRole(nextRole);
    setError('');
    setNotice('');
  }

  async function handleLogin() {
    setError('');

    if (!email.trim() || !password) {
      setError('Informe e-mail e senha.');
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

  async function handleDemoLogin(nextRole: AuthRole) {
    setRole(nextRole);
    setError('');
    setNotice('');

    try {
      setDemoLoading(nextRole);
      await loginDemo(nextRole);
      router.replace('/(tabs)');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível entrar no teste.');
    } finally {
      setDemoLoading(null);
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
                  {roleAccess[item].title}
                </Text>
                <Text style={[styles.roleDescription, role === item && styles.roleDescriptionActive]}>
                  {roleAccess[item].description}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.formCard}>
            <Text style={styles.formTitle}>
              {role === 'comprador' ? 'Acesso do comprador' : 'Acesso do vendedor'}
            </Text>
            <Text style={styles.formHint}>
              {role === 'comprador'
                ? 'Entre com o e-mail e senha cadastrados para fazer pedidos.'
                : 'Entre com o e-mail e senha cadastrados para gerenciar sua loja.'}
            </Text>

            <Input
              label="E-mail"
              value={email}
              onChangeText={setEmail}
              placeholder="seu@email.com"
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

            {notice ? <Text style={styles.noticeText}>{notice}</Text> : null}
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <Button
              title={role === 'comprador' ? 'Entrar como comprador' : 'Entrar como vendedor'}
              fullWidth
              loading={loading}
              disabled={Boolean(demoLoading)}
              onPress={handleLogin}
            />

            <View style={styles.demoRow}>
              <Text style={styles.demoText}>Conta demo:</Text>
              <Pressable disabled={loading || Boolean(demoLoading)} onPress={() => handleDemoLogin('comprador')}>
                <Text style={[styles.demoLink, (loading || Boolean(demoLoading)) && styles.demoLinkDisabled]}>
                  comprador
                </Text>
              </Pressable>
              <Text style={styles.demoText}>/</Text>
              <Pressable disabled={loading || Boolean(demoLoading)} onPress={() => handleDemoLogin('vendedor')}>
                <Text style={[styles.demoLink, (loading || Boolean(demoLoading)) && styles.demoLinkDisabled]}>
                  vendedor
                </Text>
              </Pressable>
              {demoLoading ? <Text style={styles.demoText}>entrando...</Text> : null}
            </View>

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
  noticeText: {
    padding: 10,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#FFF7F7',
    color: '#604848',
    fontSize: 12,
    fontWeight: '800',
  },
  demoRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  demoText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8A6F6F',
  },
  demoLink: {
    fontSize: 12,
    fontWeight: '900',
    color: '#050505',
    textDecorationLine: 'underline',
  },
  demoLinkDisabled: {
    opacity: 0.45,
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
