import { Image, ImageSource } from 'expo-image';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

type ProductPhotoModalProps = {
  visible: boolean;
  source: ImageSource | null;
  title: string;
  subtitle?: string;
  onClose: () => void;
};

export function ProductPhotoModal({ visible, source, title, subtitle, onClose }: ProductPhotoModalProps) {
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet}>
          {source ? <Image source={source} style={styles.image} contentFit="cover" /> : null}
          <View style={styles.caption}>
            <Text style={styles.title} numberOfLines={2}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text> : null}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.68)',
  },
  sheet: {
    overflow: 'hidden',
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
  },
  image: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#F1BFC0',
  },
  caption: {
    gap: 3,
    padding: 14,
  },
  title: {
    fontSize: 16,
    fontWeight: '900',
    color: '#050505',
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7C4E4E',
  },
});
