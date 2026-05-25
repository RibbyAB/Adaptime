import { TODAY } from '../data/seed';

export const diffColor = (d) =>
  ['', '#10B981', '#34D399', '#F59E0B', '#F97316', '#EF4444'][d] ?? '#4B6A8A';

export const diffLabel = (d) =>
  ['', 'Sangat Mudah', 'Mudah', 'Sedang', 'Sulit', 'Sangat Sulit'][d] ?? '?';

export const energyColor = (lv) =>
  lv >= 4 ? '#10B981' : lv >= 3 ? '#F59E0B' : '#EF4444';

export const daysLeft = (deadline) =>
  Math.ceil((new Date(deadline) - new Date(TODAY)) / 86400000);

export const statusBadge = (status) => {
  const map = {
    pending:      { cls: 'badge-pending',  label: 'Pending' },
    'in-progress':{ cls: 'badge-progress', label: 'Dikerjakan' },
    done:         { cls: 'badge-done',     label: 'Selesai' },
    overdue:      { cls: 'badge-overdue',  label: 'Overdue' },
  };
  return map[status] ?? { cls: 'badge-pending', label: '?' };
};

export const typeBadge = (type) => {
  const map = {
    kelas:   { cls: 'badge-kelas',   label: 'Kelas' },
    kerja:   { cls: 'badge-kerja',   label: 'Kerja' },
    pribadi: { cls: 'badge-pribadi', label: 'Pribadi' },
  };
  return map[type] ?? { cls: 'badge-kelas', label: type };
};
