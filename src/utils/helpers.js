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

  const diffTime = deadlineDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
};

/**
 * Cek apakah task masih mungkin diselesaikan sebelum deadline.
 *
 * Deadline dianggap sebagai akhir hari (23:59:59) pada tanggal yang dipilih,
 * sehingga jika deadline hari ini pukul 23:59 dan task butuh 3 jam,
 * task masih dianggap feasible selama sisa waktu hari ini ≥ 3 jam.
 *
 * @param {string} deadline   - Format "YYYY-MM-DD"
 * @param {number} hours      - Estimasi durasi task dalam jam (misal: 3, 1.5)
 * @returns {{ feasible: boolean, remainingHours: number, neededHours: number }}
 *
 * Contoh:
 *   checkFeasibility("2025-06-06", 3)
 *   → { feasible: false, remainingHours: 2.0, neededHours: 3 }  // jika sekarang jam 22:00
 *   → { feasible: true,  remainingHours: 8.0, neededHours: 3 }  // jika sekarang jam 16:00
 */
export function checkFeasibility(deadline, hours) {
  if (!deadline || !hours || hours <= 0) {
    // Data tidak lengkap — anggap feasible agar tidak salah blokir
    return { feasible: true, remainingHours: Infinity, neededHours: hours || 0 };
  }

  const now = new Date();

  // Deadline = akhir hari deadline (23:59:59), bukan awal hari
  const deadlineEnd = new Date(deadline + 'T23:59:59');

  // Selisih dalam milidetik → konversi ke jam
  const remainingMs    = deadlineEnd - now;
  const remainingHours = remainingMs / (1000 * 60 * 60);

  return {
    feasible:       remainingHours >= hours,
    remainingHours: Math.round(remainingHours * 100) / 100,
    neededHours:    hours,
  };
}

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