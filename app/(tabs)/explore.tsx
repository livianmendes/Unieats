import { Image } from 'expo-image';
import { useMemo, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { getProductImage, vendorAvatars } from '@/src/constants/product-assets';
import { useShop } from '@/src/context/shop-context';

const tabs = ['Feed', 'Atividades', 'Chat'];

export default function SocialScreen() {
  const { products } = useShop();
  const [activeTab, setActiveTab] = useState('Feed');
  const [message, setMessage] = useState('');

  const featured = useMemo(() => products[0], [products]);
  const second = useMemo(() => products[1], [products]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Social UniEats</Text>
        <View style={styles.segmented}>
          {tabs.map((tab) => (
            <Pressable
              key={tab}
              style={[styles.segment, activeTab === tab && styles.segmentActive]}
              onPress={() => setActiveTab(tab)}>
              <Text style={[styles.segmentText, activeTab === tab && styles.segmentTextActive]}>{tab}</Text>
            </Pressable>
          ))}
        </View>

        {activeTab === 'Feed' ? (
          <View style={styles.post}>
            <View style={styles.postHeader}>
              <Image source={vendorAvatars[1]} style={styles.avatar} contentFit="cover" />
              <View>
                <Text style={styles.author}>Livian em Conta UniEats</Text>
                <Text style={styles.time}>Hoje • 10:42</Text>
              </View>
            </View>
            <Text style={styles.postText}>
              Saiu fornada nova! Bolos e doces prontos para retirada no intervalo.
            </Text>
            <Image
              source={getProductImage(featured?.title ?? 'Fatia de Bolo')}
              style={styles.postImage}
              contentFit="cover"
            />
            <View style={styles.postActions}>
              <Text style={styles.actionText}>♡ 21 curtidas</Text>
              <Text style={styles.actionText}>▢ 4 comentários</Text>
            </View>

            <View style={styles.comment}>
              <Text style={styles.commentAuthor}>Daniel em Comentários</Text>
              <Text style={styles.commentText}>
                Adorei o {featured?.title ?? 'bolo'}! Vou pedir de novo hoje.
              </Text>
            </View>
          </View>
        ) : null}

        {activeTab === 'Atividades' ? (
          <View style={styles.activityList}>
            {[
              ['starysudez53', 'Começou a seguir você', 'Seguir'],
              ['nebuamoma', 'Curtiu seu post', 'Ver'],
              ['emerson10', 'Comentou no seu post', 'Abrir'],
              ['lunavagner', 'Salvou seu post', 'Ver'],
              ['shadowhunt', 'Comentou: Muito bom!', 'Abrir'],
            ].map(([name, detail, button], index) => (
              <View key={name} style={styles.activityItem}>
                <Image source={vendorAvatars[index % vendorAvatars.length]} style={styles.activityAvatar} contentFit="cover" />
                <View style={styles.activityText}>
                  <Text style={styles.activityName}>{name}</Text>
                  <Text style={styles.activityDetail}>{detail}</Text>
                </View>
                <Pressable style={styles.activityButton}>
                  <Text style={styles.activityButtonText}>{button}</Text>
                </Pressable>
              </View>
            ))}
          </View>
        ) : null}

        {activeTab === 'Chat' ? (
          <View style={styles.chatCard}>
            <View style={styles.chatHeader}>
              <Image source={vendorAvatars[1]} style={styles.avatar} contentFit="cover" />
              <View>
                <Text style={styles.author}>Helena Hills</Text>
                <Text style={styles.time}>Online há 1min</Text>
              </View>
            </View>
            <View style={styles.bubbleRight}>
              <Text style={styles.bubbleRightText}>Oi, quais doces vocês têm disponível?</Text>
            </View>
            <View style={styles.bubbleLeft}>
              <Text style={styles.bubbleLeftText}>Temos {featured?.title ?? 'bolo'} e {second?.title ?? 'brigadeiro'}.</Text>
            </View>
            <View style={styles.bubbleRight}>
              <Text style={styles.bubbleRightText}>Pode reservar para mim?</Text>
            </View>
            <Image
              source={getProductImage(second?.title ?? 'Brigadeiro Gourmet')}
              style={styles.chatImage}
              contentFit="cover"
            />
            <View style={styles.messageRow}>
              <TextInput
                value={message}
                onChangeText={setMessage}
                placeholder="Mensagem..."
                placeholderTextColor="#8A6F6F"
                style={styles.messageInput}
              />
              <Pressable style={styles.sendButton} onPress={() => setMessage('')}>
                <Text style={styles.sendButtonText}>›</Text>
              </Pressable>
            </View>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAD8D8',
  },
  scroll: {
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
    padding: 18,
    paddingBottom: 105,
    gap: 16,
  },
  title: {
    fontSize: 23,
    fontWeight: '900',
    color: '#050505',
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
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
  segmentActive: {
    backgroundColor: '#050505',
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#050505',
  },
  segmentTextActive: {
    color: '#FFFFFF',
  },
  post: {
    gap: 12,
    padding: 14,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  author: {
    fontSize: 13,
    fontWeight: '900',
    color: '#050505',
  },
  time: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: '700',
    color: '#7C4E4E',
  },
  postText: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '700',
    color: '#050505',
  },
  postImage: {
    width: '100%',
    height: 250,
    borderRadius: 16,
    backgroundColor: '#F1BFC0',
  },
  postActions: {
    flexDirection: 'row',
    gap: 16,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#050505',
  },
  comment: {
    gap: 4,
    padding: 12,
    borderRadius: 14,
    backgroundColor: '#FAD8D8',
  },
  commentAuthor: {
    fontSize: 11,
    fontWeight: '900',
    color: '#D82020',
  },
  commentText: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '700',
    color: '#050505',
  },
  activityList: {
    gap: 10,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
  },
  activityAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  activityText: {
    flex: 1,
    minWidth: 0,
  },
  activityName: {
    fontSize: 13,
    fontWeight: '900',
    color: '#050505',
  },
  activityDetail: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: '700',
    color: '#7C4E4E',
  },
  activityButton: {
    height: 30,
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderRadius: 15,
    backgroundColor: '#050505',
  },
  activityButtonText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  chatCard: {
    gap: 12,
    padding: 14,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  bubbleRight: {
    alignSelf: 'flex-end',
    maxWidth: '82%',
    padding: 10,
    borderRadius: 16,
    backgroundColor: '#050505',
  },
  bubbleRightText: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  bubbleLeft: {
    alignSelf: 'flex-start',
    maxWidth: '82%',
    padding: 10,
    borderRadius: 16,
    backgroundColor: '#FAD8D8',
  },
  bubbleLeftText: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '800',
    color: '#050505',
  },
  chatImage: {
    width: 170,
    height: 130,
    borderRadius: 14,
    backgroundColor: '#F1BFC0',
  },
  messageRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  messageInput: {
    flex: 1,
    height: 42,
    paddingHorizontal: 12,
    borderRadius: 21,
    backgroundColor: '#FAD8D8',
    color: '#050505',
    fontWeight: '700',
  },
  sendButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 21,
    backgroundColor: '#050505',
  },
  sendButtonText: {
    marginTop: -3,
    fontSize: 30,
    fontWeight: '900',
    color: '#FFFFFF',
  },
});
