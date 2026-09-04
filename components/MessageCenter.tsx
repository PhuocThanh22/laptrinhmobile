import { useEffect, useRef, useState } from 'react';

import { CenterMessage } from './CenterMessage';

export type MessageOptions = {
  type?: 'success' | 'error' | 'info';
  text1?: string;
  text2?: string;
};

let push: ((options: MessageOptions) => void) | null = null;

/** Hiển thị thông báo popup giữa màn hình (thay thế Toast). */
export function showMessage(options: MessageOptions) {
  push?.(options);
}

export function MessageCenter() {
  const [current, setCurrent] = useState<MessageOptions | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    push = (options) => {
      setCurrent(options);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCurrent(null), 3200);
    };
    return () => {
      push = null;
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  if (!current) return null;

  const title =
    current.text1 ||
    (current.type === 'error' ? 'Thao tác thất bại' : 'Thông báo');

  return (
    <CenterMessage
      visible
      type={current.type === 'error' ? 'error' : current.type === 'info' ? 'info' : 'success'}
      title={title}
      message={current.text2}
      onClose={() => setCurrent(null)}
    />
  );
}