import React from 'react';
import { Platform, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

type PhoneFrameProps = {
  label: string;
  badge: string;
  name: string;
  src: string;
};

function PhoneFrame({ label, badge, name, src }: PhoneFrameProps) {
  return (
    <View style={styles.phoneBlock}>
      <View style={styles.labelRow}>
        <Text style={styles.phoneLabel}>{label}</Text>
        <Text style={styles.badge}>{badge}</Text>
      </View>
      <View style={styles.phone}>
        {Platform.OS === 'web' ? (
          React.createElement('iframe', {
            name,
            src,
            title: `UniEats ${label}`,
            style: {
              width: '100%',
              height: '100%',
              border: 0,
              borderRadius: 28,
              backgroundColor: '#FAD8D8',
            },
          })
        ) : (
          <View style={styles.nativeFallback}>
            <Text style={styles.nativeFallbackText}>Abra esta tela no navegador web.</Text>
          </View>
        )}
      </View>
    </View>
  );
}

export default function DemoCelularesScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>UniEats em dois celulares</Text>
            <Text style={styles.subtitle}>Comprador e vendedor com sessoes separadas no mesmo navegador.</Text>
          </View>
          <Text style={styles.portText}>App 8081 | API 3100</Text>
        </View>

        <View style={styles.stage}>
          <PhoneFrame
            label="Comprador"
            badge="Marina Alves"
            name="unieats-comprador"
            src="/login?role=comprador&phone=comprador"
          />
          <PhoneFrame
            label="Vendedor"
            badge="Ana Clara Souza"
            name="unieats-vendedor"
            src="/login?role=vendedor&phone=vendedor"
          />
        </View>

        <Text style={styles.hint}>
          Em cada tela, use Preencher com conta demo e depois toque em Entrar.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#111111',
  },
  scroll: {
    flexGrow: 1,
    width: '100%',
    maxWidth: 1040,
    alignSelf: 'center',
    padding: 24,
    gap: 22,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 18,
    flexWrap: 'wrap',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '900',
  },
  subtitle: {
    marginTop: 8,
    color: '#A8A8A8',
    fontSize: 14,
    fontWeight: '700',
  },
  portText: {
    color: '#A8A8A8',
    fontSize: 13,
    fontWeight: '800',
  },
  stage: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 30,
    flexWrap: 'wrap',
  },
  phoneBlock: {
    width: '100%',
    maxWidth: 390,
    gap: 12,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  phoneLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  badge: {
    overflow: 'hidden',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: '#FAD8D8',
    color: '#050505',
    fontSize: 12,
    fontWeight: '900',
  },
  phone: {
    width: '100%',
    aspectRatio: 390 / 844,
    padding: 12,
    borderRadius: 38,
    backgroundColor: '#050505',
  },
  nativeFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 28,
    backgroundColor: '#FAD8D8',
    padding: 16,
  },
  nativeFallbackText: {
    color: '#050505',
    fontWeight: '900',
    textAlign: 'center',
  },
  hint: {
    color: '#A8A8A8',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
});
