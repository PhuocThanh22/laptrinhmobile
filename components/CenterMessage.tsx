import { AlertTriangle, Check, Info } from 'lucide-react-native';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from './Button';
import { Colors } from '@/constants/colors';

interface CenterMessageProps {
  visible: boolean;
  type?: 'success' | 'error' | 'info';
  title: string;
  message?: string;
  buttonText?: string;
  onClose: () => void;
}

export function CenterMessage({
  visible,
  type = 'success',
  title,
  message,
  buttonText = 'OK',
  onClose,
}: CenterMessageProps) {
  const isError = type === 'error';
  const isInfo = type === 'info';
  const color = isError ? Colors.danger : isInfo ? Colors.info : Colors.success;
  const bg = isError ? Colors.dangerSoft : isInfo ? Colors.infoSoft : Colors.successSoft;
  const Icon = isError ? AlertTriangle : isInfo ? Info : Check;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.box} onPress={() => {}}>
          <View style={[styles.iconWrap, { backgroundColor: bg }]}>
            <Icon size={30} color={color} />
          </View>
          <Text style={styles.title}>{title}</Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}
          <Button title={buttonText} variant={isError ? 'primary' : 'primary'} onPress={onClose} style={styles.button} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  box: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  iconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
    textAlign: 'center',
  },
  message: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 19,
  },
  button: {
    marginTop: 20,
    minWidth: 140,
  },
});