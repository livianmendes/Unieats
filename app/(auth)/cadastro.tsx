import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/src/components/Button';
import { Input } from '@/src/components/Input';
import { LogoUniEats } from '@/src/components/LogoUniEats';
import { AuthRole, useAuth } from '@/src/context/auth-context';

export default function SignupScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const [role, setRole] = useState<AuthRole>('comprador');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [matricula, setMatricula] = useState('');
  const [curso, setCurso] = useState('');
  const [universidade, setUniversidade] = useState('UFGD');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    setError('');

    if (!name.trim() || !email.trim() || !phone.trim() || password.length < 6) {
      setError('Preencha nome, e-mail, telefone e senha com no mínimo 6 caracteres.');
      return;
    }

    if (role === 'vendedor') {
      if (!/@academico\.ufgd$/i.test(email.trim())) {
        setError('Vendedores precisam usar e-mail institucional @academico.ufgd.');
        return;
      }

      if (!matricula.trim() || !curso.trim() || !universidade.trim()) {
        setError('Vendedores precisam informar matrícula, curso e universidade.');
        return;
      }
    }

    try {
      setLoading(true);
      await register({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
        role,
        matricula: matricula.trim() || undefined,
        curso: curso.trim() || undefined,
        universidade: universidade.trim() || undefined,
      });
      router.replace('/login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível criar a conta.');
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
            <LogoUniEats size="md" />
            <Text style={styles.title}>Criar conta</Text>
            <Text style={styles.subtitle}>Escolha o tipo de acesso para liberar as funções certas.</Text>
          </View>

          <View style={styles.segmented}>
            {(['comprador', 'vendedor'] as AuthRole[]).map((item) => (
              <Pressable
                key={item}
                style={[styles.segment, role === item && styles.segmentActive]}
                onPress={() => setRole(item)}>
                <Text style={[styles.segmentText, role === item && styles.segmentTextActive]}>
                  {item === 'comprador' ? 'Comprador' : 'Vendedor'}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.formCard}>
            <Input label="Nome completo" value={name} onChangeText={setName} placeholder="Seu nome" />
            <Input
              label={role === 'vendedor' ? 'E-mail institucional' : 'E-mail'}
              value={email}
              onChangeText={setEmail}
              placeholder={role === 'vendedor' ? 'seu@academico.ufgd' : 'seu@email.com'}
              icon="envelope"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Input label="Telefone" value={phone} onChangeText={setPhone} placeholder="67999990000" keyboardType="phone-pad" />
            <Input label="Senha" value={password} onChangeText={setPassword} placeholder="Mínimo 6 caracteres" secureTextEntry icon="lock.fill" />

            {role === 'vendedor' ? (
              <>
                <Input label="Matrícula" value={matricula} onChangeText={setMatricula} placeholder="20260001" />
                <Input label="Curso" value={curso} onChangeText={setCurso} placeholder="Seu curso" />
                <Input label="Universidade" value={universidade} onChangeText={setUniversidade} placeholder="UFGD" />
              </>
            ) : null}

            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            <Button title="Criar cadastro" fullWidth loading={loading} onPress={handleRegister} />

            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Já tem conta?</Text>
              <Link href="/login" style={styles.link}>Voltar ao login</Link>
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
    gap: 16,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    padding: 20,
    paddingBottom: 34,
  },
  logoWrap: {
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  title: {
    fontSize: 25,
    fontWeight: '900',
    color: '#050505',
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '800',
    color: '#604848',
  },
  segmented: {
    flexDirection: 'row',
    gap: 8,
    padding: 4,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
  },
  segment: {
    flex: 1,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 19,
  },
  segmentActive: {
    backgroundColor: '#050505',
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#050505',
  },
  segmentTextActive: {
    color: '#FFFFFF',
  },
  formCard: {
    gap: 13,
    padding: 18,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
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
