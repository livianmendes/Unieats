import { Link, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Keyboard, SafeAreaView, ScrollView, StyleSheet, TextInput, TouchableWithoutFeedback, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Button } from '@/src/components/Button';
import { Input } from '@/src/components/Input';
import { LogoUniEats } from '@/src/components/LogoUniEats';
import { Colors } from '@/src/constants/theme';
import { useAuth } from '@/src/context/auth-context';

export default function SignupScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const { register } = useAuth();
  const nameRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);
  const codeRef = useRef<TextInput>(null);
  const [step, setStep] = useState<'form' | 'code'>('form');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [matricula, setMatricula] = useState('');
  const [curso, setCurso] = useState('');
  const [universidade, setUniversidade] = useState('');
  const [phone, setPhone] = useState('');
  const [accountType, setAccountType] = useState<'comprador' | 'vendedor'>('comprador');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [matriculaError, setMatriculaError] = useState('');
  const [cursoError, setCursoError] = useState('');
  const [universidadeError, setUniversidadeError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [codeError, setCodeError] = useState('');

  function validateEmail(value: string) {
    if (accountType === 'vendedor') {
      return /@academico\.ufgd$/i.test(value.trim());
    }
    return /^\S+@\S+\.\S+$/.test(value.trim());
  }

  function handleCreateAccount() {
    setEmailError('');
    setMatriculaError('');
    setCursoError('');
    setUniversidadeError('');
    setPhoneError('');
    setPasswordError('');

    if (!name.trim()) {
      setPasswordError('Informe seu nome completo.');
      return;
    }

    if (!validateEmail(email)) {
      setEmailError(
        accountType === 'vendedor'
          ? 'Use um e-mail institucional @academico.ufgd.'
          : 'Informe um e-mail válido.'
      );
      return;
    }

    if (accountType === 'vendedor') {
      if (!matricula.trim()) {
        setMatriculaError('Informe sua matrícula.');
        return;
      }
      if (!curso.trim()) {
        setCursoError('Informe seu curso.');
        return;
      }
      if (!universidade.trim()) {
        setUniversidadeError('Informe sua universidade.');
        return;
      }
    }

    if (!/^[0-9]{8,15}$/.test(phone.replace(/\D/g, ''))) {
      setPhoneError('Informe um telefone válido sem símbolos.');
      return;
    }

    if (password.length < 6 || password !== confirmPassword) {
      setPasswordError('As senhas devem ter no mínimo 6 caracteres e coincidir.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep('code');
      setTimeout(() => {
        codeRef.current?.focus();
      }, 100);
    }, 1200);
  }

  function handleVerifyCode() {
    setCodeError('');

    if (!/^[0-9]{6}$/.test(verificationCode)) {
      setCodeError('Digite o código de 6 dígitos.');
      return;
    }

    register({
      email: email.trim(),
      role: accountType,
      name: name.trim(),
      phone: phone.trim(),
      matricula: matricula.trim() || undefined,
      curso: curso.trim() || undefined,
      universidade: universidade.trim() || undefined,
    });

    router.replace('/login');
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}> 
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="always">
          <ThemedView style={styles.container}>
            <LogoUniEats size="md" />
            <ThemedText type="title" style={styles.title}>
              {step === 'form' ? 'Criar conta' : 'Verificar e-mail'}
            </ThemedText>

            {step === 'form' ? (
              <>
                <ThemedText style={styles.subtitle}>
                  Acadêmicos criam login com matrícula, curso e universidade, depois escolhem o perfil.
                </ThemedText>
                <ThemedText style={styles.smallText}>
                  Vendedor: responsável pela venda e publicação de produtos.
                </ThemedText>
                <ThemedText style={styles.smallText}>
                  Comprador: consome produtos disponíveis à venda sem precisar de login institucional.
                </ThemedText>

                <View style={styles.roleRow}>
                  <Button
                    title="Comprador"
                    variant={accountType === 'comprador' ? 'primary' : 'secondary'}
                    fullWidth
                    onPress={() => setAccountType('comprador')}
                    style={styles.roleButton}
                  />
                  <Button
                    title="Vendedor"
                    variant={accountType === 'vendedor' ? 'primary' : 'secondary'}
                    fullWidth
                    onPress={() => setAccountType('vendedor')}
                    style={styles.roleButton}
                  />
                </View>

                <Input
                  ref={nameRef}
                  label="Nome completo"
                  value={name}
                  onChangeText={setName}
                  placeholder="Seu nome"
                  returnKeyType="next"
                  blurOnSubmit={false}
                  onSubmitEditing={() => emailRef.current?.focus()}
                />
                <Input
                  ref={emailRef}
                  label={accountType === 'vendedor' ? 'E-mail institucional' : 'E-mail'}
                  value={email}
                  onChangeText={setEmail}
                  placeholder={accountType === 'vendedor' ? 'seu@academico.ufgd' : 'seu@email.com'}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  icon="envelope"
                  error={emailError}
                  returnKeyType="next"
                  blurOnSubmit={false}
                  onSubmitEditing={() => passwordRef.current?.focus()}
                />
                {accountType === 'vendedor' ? (
                  <>
                    <Input
                      label="Matrícula"
                      value={matricula}
                      onChangeText={setMatricula}
                      placeholder="12345678"
                      error={matriculaError}
                      returnKeyType="next"
                      blurOnSubmit={false}
                      onSubmitEditing={() => passwordRef.current?.focus()}
                    />
                    <Input
                      label="Curso"
                      value={curso}
                      onChangeText={setCurso}
                      placeholder="Seu curso"
                      error={cursoError}
                    />
                    <Input
                      label="Universidade"
                      value={universidade}
                      onChangeText={setUniversidade}
                      placeholder="Sua universidade"
                      error={universidadeError}
                    />
                  </>
                ) : null}
                <Input
                  label="Telefone (WhatsApp)"
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="812345678"
                  keyboardType="phone-pad"
                  icon="phone.fill"
                  error={phoneError}
                />
                <Input
                  ref={passwordRef}
                  label="Senha"
                  value={password}
                  onChangeText={setPassword}
                  placeholder="********"
                  secureTextEntry
                  icon="lock.fill"
                  returnKeyType="next"
                  blurOnSubmit={false}
                  onSubmitEditing={() => confirmPasswordRef.current?.focus()}
                />
                <Input
                  ref={confirmPasswordRef}
                  label="Confirmar senha"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="********"
                  secureTextEntry
                  icon="lock.fill"
                  error={passwordError}
                  returnKeyType="done"
                  onSubmitEditing={handleCreateAccount}
                />
                <Button title="Continuar" fullWidth loading={loading} onPress={handleCreateAccount} />
              </>
            ) : (
              <>
                <ThemedText style={styles.subtitle}>
                  Enviamos um código de verificação de 6 dígitos para {email}. Informe-o abaixo para ativar sua conta.
                </ThemedText>
                <Input
                  ref={codeRef}
                  label="Código de verificação"
                  value={verificationCode}
                  onChangeText={setVerificationCode}
                  placeholder="123456"
                  keyboardType="numeric"
                  icon="key.fill"
                  error={codeError}
                />
                <Button title="Confirmar código" fullWidth onPress={handleVerifyCode} />
                <ThemedText style={styles.pendingText}>
                  Seu cadastro ficará com o status "Pendente de Validação" até a aprovação institucional.
                </ThemedText>
              </>
            )}

            <View style={styles.footerRow}>
              <ThemedText>{step === 'form' ? 'Já tem conta?' : 'Já confirmou o código?'}</ThemedText>
              <Link href="/login" style={[styles.link, { color: theme.tint }]}>Voltar ao Login</Link>
            </View>
          </ThemedView>
        </ScrollView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  container: {
    width: '100%',
    gap: 18,
  },
  title: {
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 8,
  },
  smallText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
    marginBottom: 6,
  },
  roleRow: {
    flexDirection: 'row',
    gap: 10,
  },
  roleButton: {
    flex: 1,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  link: {
    textDecorationLine: 'underline',
    fontSize: 16,
  },
  pendingText: {
    marginTop: 12,
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
  },
});
