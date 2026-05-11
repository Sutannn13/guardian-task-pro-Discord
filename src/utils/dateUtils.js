export function formatDate(date, locale = 'id-ID') {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';

  return d.toLocaleDateString(locale, {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function formatDeadline(deadline) {
  if (!deadline) return 'Tidak ada batas waktu';

  const d = new Date(deadline);
  if (isNaN(d.getTime())) return 'Format tidak valid';

  const now = new Date();
  const diff = d.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

  const formatted = d.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  if (days < 0) {
    return `${formatted} (Lewat ${Math.abs(days)} hari)`;
  } else if (days === 0) {
    return `${formatted} (Hari ini)`;
  } else if (days === 1) {
    return `${formatted} (Besok)`;
  } else if (days <= 7) {
    return `${formatted} (${days} hari)`;
  }

  return formatted;
}

export function getCurrentTimestamp() {
  return new Date().toISOString();
}

export function parseRelativeTime(date) {
  const d = new Date(date);
  if (isNaN(d.getTime())) return null;

  const now = new Date();
  const diff = now.getTime() - d.getTime();

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return ' baru saja';
  if (minutes < 60) return `${minutes} menit lalu`;
  if (hours < 24) return `${hours} jam lalu`;
  if (days < 7) return `${days} hari lalu`;

  return formatDate(date);
}

export default { formatDate, formatDeadline, getCurrentTimestamp, parseRelativeTime };