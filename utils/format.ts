/** Định dạng số thành tiền Việt Nam: 250000 -> "250.000đ" */
export function formatCurrency(value: number | undefined | null): string {
  const n = Math.round(Number(value ?? 0));
  return `${n.toLocaleString('vi-VN')}đ`;
}

/** Định dạng epoch ms -> "20/08/2026 20:00" */
export function formatDateTime(ts: number | undefined | null): string {
  if (!ts) return '--';
  const d = new Date(ts);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
}

/** Định dạng epoch ms -> "20/08/2026" */
export function formatDate(ts: number | undefined | null): string {
  if (!ts) return '--';
  const d = new Date(ts);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
}

/** Định dạng epoch ms -> "02:15:30" dạng giờ:phút:giây */
export function formatCountdown(ms: number): string {
  if (ms <= 0) return '00:00:00';
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

/** Định dạng epoch ms dạng dài: "2 ngày 03:15:00" */
export function formatCountdownLong(ms: number): string {
  if (ms <= 0) return '00:00:00';
  const days = Math.floor(ms / 86400000);
  const rest = ms - days * 86400000;
  const hh = formatCountdown(rest);
  if (days > 0) return `${days} ngày ${hh}`;
  return hh;
}