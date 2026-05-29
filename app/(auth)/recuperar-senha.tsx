import { useState } from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';
import { Link } from 'expo-router';

import { Button } from '@/src/components/Button';
import { Input } from '@/src/components/Input';
import { LogoUniEats } from '@/src/components/LogoUniEats';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/src/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function ForgotPasswordScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  function handleSend() {
    setSubmitted(true);
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}> 
      <ThemedView style={styles.container}>
        <LogoUniEats size="md" />
        <ThemedText type="title">Recuperar senha</ThemedText>
        {submitted ? (
          <ThemedText>
            Enviamos um link de recuperação para o seu e-mail. Verifique sua caixa de entrada.
          </ThemedText>
        ) : (
          <>
            <ThemedText>
              Informe seu e-mail e enviaremos um link de recuperação.
            </ThemedText>
            <Input
              label="E-mail"
              value={email}
              onChangeText={setEmail}
              placeholder="seu@email.com"
              icon="envelope"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Button title="Enviar" fullWidth onPress={handleSend} />
          </>
        )}
        <View style={styles.footerRow}>
          <Link href="/login" style={[styles.link, { color: theme.tint }]}>Voltar ao Login</Link>
        </View>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    gap: 18,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    alignItems: 'center',
  },
  link: {
    textDecorationLine: 'underline',
    fontSize: 16,
  },
});
