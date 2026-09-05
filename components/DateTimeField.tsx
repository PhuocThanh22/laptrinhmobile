import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Calendar, ChevronRight } from 'lucide-react-native';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useState } from 'react';

import { Colors } from '@/constants/colors';
import { formatDateTime } from '@/utils/format';

interface DateTimeFieldProps {
  label?: string;
  value: Date;
  onChange: (date: Date) => void;
  minimumDate?: Date;
}

/**
 * Chọn thời gian kết thúc đấu giá.
 * - iOS: dùng 1 picker datetime.
 * - Android: chọn ngày trước, tự động chuyển sang chọn giờ.
 */
export function DateTimeField({ label, value, onChange, minimumDate }: DateTimeFieldProps) {
  const [show, setShow] = useState(false);
  const [mode, setMode] = useState<'date' | 'time'>('date');

  const open = () => {
    setMode('date');
    setShow(true);
  };

  const onPickerChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (event.type === 'dismissed') {
      setShow(false);
      return;
    }
    if (!selected) return;

    if (Platform.OS === 'android') {
      if (mode === 'date') {
        const newDate = new Date(value);
        newDate.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
        setValueSafe(newDate);
        setMode('time');
        setShow(true);
      } else {
        const newDate = new Date(value);
        newDate.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
        setValueSafe(newDate);
        setShow(false);
      }
    } else {
      setValueSafe(selected);
      setShow(false);
    }
  };

  const setValueSafe = (date: Date) => {
    if (minimumDate && date.getTime() < minimumDate.getTime()) {
      onChange(new Date(minimumDate.getTime()));
    } else {
      onChange(date);
    }
  };

  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <Pressable onPress={open} style={styles.field}>
        <Calendar size={18} color={Colors.textMuted} />
        <Text style={styles.value}>{formatDateTime(value.getTime())}</Text>
        <ChevronRight size={18} color={Colors.textMuted} />
      </Pressable>

      {show ? (
        <DateTimePicker
          value={value}
          mode={mode as 'date' | 'time'}
          is24Hour
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          minimumDate={minimumDate}
          onChange={onPickerChange}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 6,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    gap: 8,
  },
  value: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
  },
});