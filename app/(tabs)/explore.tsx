import { Image } from 'expo-image';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { getProductImage, vendorAvatars } from '@/src/constants/product-assets';
import { API_BASE } from '@/src/constants/api';
import { useAuth } from '@/src/context/auth-context';
import { useShop } from '@/src/context/shop-context';

type SocialTab = 'Feed' | 'Atividades' | 'Chat';

type ChatMessage = {
  id: string;
  senderRole: string;
  senderName: string;
  text: string;
  createdAt: string;
};

type Comment = {
  id: string;
  author: string;
  text: string;
};

const tabs: SocialTab[] = ['Feed', 'Atividades', 'Chat'];

async function readApiResponse<T>(response: Response): Promise<T> {
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Não foi possível concluir a operação.');
  }

  return data;
}

export default function SocialScreen() {
  const { products } = useShop();
  const { token, user } = useAuth();
  const [activeTab, setActiveTab] = useState<SocialTab>('Feed');
  const [message, setMessage] = useState('');
  const [commentDraft, setCommentDraft] = useState('');
  const [liked, setLiked] = useState(false);
  const [activityNotice, setActivityNotice] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatError, setChatError] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [comments, setComments] = useState<Comment[]>([
    {
      id: 'initial-comment',
      author: 'Daniel',
      text: 'Adorei o bolo! Vou pedir de novo hoje.',
    },
  ]);

  const featured = useMemo(() => products[0], [products]);
  const second = useMemo(() => products[1], [products]);
  const likeCount = liked ? 22 : 21;

  const loadChat = useCallback(async () => {
    if (!token) {
      return;
    }

    try {
      setChatLoading(true);
      setChatError('');
      const response = await fetch(`${API_BASE}/social/chat`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await readApiResponse<ChatMessage[]>(response);
      setChatMessages(data);
    } catch (err) {
      setChatError(err instanceof Error ? err.message : 'Não foi possível carregar o chat.');
    } finally {
      setChatLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (activeTab === 'Chat') {
      loadChat();
    }
  }, [activeTab, loadChat]);

  function addComment() {
    const text = commentDraft.trim();

    if (!text) {
      return;
    }

    setComments((current) => [
      ...current,
      {
        id: `comment-${Date.now()}`,
        author: user?.name ?? 'Você',
        text,
      },
    ]);
    setCommentDraft('');
  }

  function handleActivity(button: string) {
    if (button === 'Seguir') {
      setActivityNotice('Perfil seguido.');
      return;
    }

    if (button === 'Abrir') {
      setActiveTab('Chat');
      return;
    }

    setActiveTab('Feed');
  }

  async function sendChatMessage() {
    const text = message.trim();

    if (!text || !token) {
      return;
    }

    try {
      setSending(true);
      setChatError('');
      const response = await fetch(`${API_BASE}/social/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text }),
      });
      const data = await readApiResponse<ChatMessage[]>(response);
      setChatMessages(data);
      setMessage('');
    } catch (err) {
      setChatError(err instanceof Error ? err.message : 'Não foi possível enviar a mensagem.');
    } finally {
      setSending(false);
    }
  }

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
              <Pressable style={styles.inlineAction} onPress={() => setLiked((current) => !current)}>
                <Text style={styles.actionText}>{liked ? 'Curtido' : 'Curtir'} · {likeCount}</Text>
              </Pressable>
              <Text style={styles.actionText}>{comments.length} comentários</Text>
            </View>

            <View style={styles.commentList}>
              {comments.map((comment) => (
                <View key={comment.id} style={styles.comment}>
                  <Text style={styles.commentAuthor}>{comment.author}</Text>
                  <Text style={styles.commentText}>{comment.text}</Text>
                </View>
              ))}
            </View>

            <View style={styles.messageRow}>
              <TextInput
                value={commentDraft}
                onChangeText={setCommentDraft}
                placeholder="Escrever comentário..."
                placeholderTextColor="#8A6F6F"
                style={styles.messageInput}
              />
              <Pressable style={styles.sendButton} onPress={addComment}>
                <Text style={styles.sendButtonText}>Enviar</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        {activeTab === 'Atividades' ? (
          <View style={styles.activityList}>
            {activityNotice ? <Text style={styles.notice}>{activityNotice}</Text> : null}
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
                <Pressable style={styles.activityButton} onPress={() => handleActivity(button)}>
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
                <Text style={styles.author}>{user?.role === 'vendedor' ? 'Atendimento UniEats' : 'Livian'}</Text>
                <Text style={styles.time}>{chatLoading ? 'Carregando...' : 'Online'}</Text>
              </View>
            </View>

            {chatMessages.map((chatMessage) => {
              const fromUser = chatMessage.senderRole === 'user';

              return (
                <View
                  key={chatMessage.id}
                  style={[styles.bubble, fromUser ? styles.bubbleRight : styles.bubbleLeft]}>
                  <Text style={[styles.bubbleAuthor, fromUser ? styles.bubbleRightAuthor : styles.bubbleLeftAuthor]}>
                    {fromUser ? 'Você' : chatMessage.senderName}
                  </Text>
                  <Text style={[styles.bubbleText, fromUser ? styles.bubbleRightText : styles.bubbleLeftText]}>
                    {chatMessage.text}
                  </Text>
                </View>
              );
            })}

            {chatMessages.length === 0 && !chatLoading ? (
              <Text style={styles.emptyChat}>Nenhuma mensagem ainda.</Text>
            ) : null}

            <Image
              source={getProductImage(second?.title ?? 'Brigadeiro Gourmet')}
              style={styles.chatImage}
              contentFit="cover"
            />

            {chatError ? <Text style={styles.errorText}>{chatError}</Text> : null}

            <View style={styles.messageRow}>
              <TextInput
                value={message}
                onChangeText={setMessage}
                placeholder="Mensagem..."
                placeholderTextColor="#8A6F6F"
                style={styles.messageInput}
                onSubmitEditing={sendChatMessage}
                returnKeyType="send"
              />
              <Pressable style={[styles.sendButton, sending && styles.sendButtonDisabled]} onPress={sendChatMessage} disabled={sending}>
                <Text style={styles.sendButtonText}>{sending ? '...' : 'Enviar'}</Text>
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
    gap: 14,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#050505',
  },
  segmented: {
    flexDirection: 'row',
    gap: 6,
    padding: 4,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
  },
  segment: {
    flex: 1,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
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
    borderRadius: 16,
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
    borderRadius: 14,
    backgroundColor: '#F1BFC0',
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flexWrap: 'wrap',
  },
  inlineAction: {
    minHeight: 28,
    justifyContent: 'center',
  },
  actionText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#050505',
  },
  commentList: {
    gap: 8,
  },
  comment: {
    gap: 4,
    padding: 10,
    borderRadius: 12,
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
  notice: {
    padding: 10,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    color: '#050505',
    fontWeight: '800',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
  },
  activityAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    borderRadius: 12,
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
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 2,
  },
  bubble: {
    maxWidth: '86%',
    gap: 3,
    padding: 10,
    borderRadius: 14,
  },
  bubbleRight: {
    alignSelf: 'flex-end',
    backgroundColor: '#050505',
  },
  bubbleLeft: {
    alignSelf: 'flex-start',
    backgroundColor: '#FAD8D8',
  },
  bubbleAuthor: {
    fontSize: 10,
    fontWeight: '900',
  },
  bubbleRightAuthor: {
    color: '#FAD8D8',
  },
  bubbleLeftAuthor: {
    color: '#D82020',
  },
  bubbleText: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '800',
  },
  bubbleRightText: {
    color: '#FFFFFF',
  },
  bubbleLeftText: {
    color: '#050505',
  },
  emptyChat: {
    paddingVertical: 18,
    textAlign: 'center',
    color: '#604848',
    fontWeight: '800',
  },
  chatImage: {
    width: 170,
    height: 130,
    borderRadius: 14,
    backgroundColor: '#F1BFC0',
  },
  errorText: {
    color: '#B91C1C',
    fontWeight: '800',
  },
  messageRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  messageInput: {
    flex: 1,
    minHeight: 42,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: '#FAD8D8',
    color: '#050505',
    fontWeight: '700',
  },
  sendButton: {
    minWidth: 74,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: '#050505',
  },
  sendButtonDisabled: {
    opacity: 0.65,
  },
  sendButtonText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FFFFFF',
  },
});
