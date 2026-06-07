export const diffColor = (d) =>
  ['', '#10B981', '#34D399', '#F59E0B', '#F97316', '#EF4444'][d] ?? '#4B6A8A';

export const diffLabel = (d) =>
  ['', 'Sangat Mudah', 'Mudah', 'Sedang', 'Sulit', 'Sangat Sulit'][d] ?? '?';

export const energyColor = (lv) =>
  lv >= 4 ? '#10B981' : lv >= 3 ? '#F59E0B' : '#EF4444';

export const daysLeft = (deadline) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadlineDate = new Date(deadline + 'T00:00:00');
  deadlineDate.setHours(0, 0, 0, 0);
  return Math.ceil((deadlineDate - today) / (1000 * 60 * 60 * 24));
};

export const statusBadge = (status) => {
  const map = {
    pending:       { cls: 'badge-pending',  label: 'Pending' },
    'in-progress': { cls: 'badge-progress', label: 'Dikerjakan' },
    done:          { cls: 'badge-done',     label: 'Selesai' },
    overdue:       { cls: 'badge-overdue',  label: 'Overdue' },
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

/**
 * Cek apakah task masih bisa diselesaikan sebelum deadline.
 * Deadline dianggap akhir hari (23:59:59).
 */
export function checkFeasibility(deadline, hours) {
  if (!deadline || !hours || hours <= 0) {
    return { feasible: true, remainingHours: Infinity, neededHours: hours || 0 };
  }
  const now            = new Date();
  const deadlineEnd    = new Date(deadline + 'T23:59:59');
  const remainingMs    = deadlineEnd - now;
  const remainingHours = remainingMs / (1000 * 60 * 60);
  return {
    feasible:        remainingHours >= hours,
    remainingHours:  Math.round(remainingHours * 100) / 100,
    neededHours:     hours,
  };
}
