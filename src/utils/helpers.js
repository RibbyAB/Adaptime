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

// ── Simple feasibility check (used in TaskModal) ───────────────────────────
export function checkFeasibility(deadline, hours) {
  if (!deadline || !hours || hours <= 0) {
    return { feasible: true, remainingHours: Infinity, neededHours: hours || 0 };
  }
  const now            = new Date();
  const deadlineEnd    = new Date(deadline + 'T23:59:59');
  const remainingMs    = deadlineEnd - now;
  const remainingHours = remainingMs / (1000 * 60 * 60);
  return {
    feasible:       remainingHours >= hours,
    remainingHours: Math.round(remainingHours * 100) / 100,
    neededHours:    hours,
  };
}

// ── Detailed feasibility check with energy profile (used in Tasks page) ────
const SLOT_HOURS = {
  morning:   6,   // 06–12
  afternoon: 5,   // 12–17
  evening:   3,   // 17–20
  night:     4,   // 20–24
};

export function checkDeadlineFeasibility(task, energy) {
  const now        = new Date();
  const deadlineMs = new Date(task.deadline + 'T23:59:59').getTime();
  const nowMs      = now.getTime();

  if (deadlineMs <= nowMs) {
    return { feasible: false, availableHours: 0, hoursNeeded: task.hours || 0, deficit: task.hours || 0, daysUntil: 0 };
  }

  const diffMs      = deadlineMs - nowMs;
  const diffDays    = diffMs / (1000 * 60 * 60 * 24);
  const hoursNeeded = task.hours || 0;

  let availableHours;

  if (diffDays < 1) {
    // Deadline is today: use actual remaining clock hours, not a scaled estimate.
    // The user can work right up to midnight, so raw hours remaining is the right ceiling.
    availableHours = Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10;
  } else {
    // Deadline is tomorrow or later: use energy-weighted productive hours per day.
    let productiveHoursPerDay = 0;
    for (const [slotKey, slotHours] of Object.entries(SLOT_HOURS)) {
      const energyLevel = (energy && energy[slotKey]) || 3;
      if (energyLevel >= 2) {
        productiveHoursPerDay += slotHours * Math.min(energyLevel / 5, 1);
      }
    }
    productiveHoursPerDay = Math.min(productiveHoursPerDay, 8);
    availableHours = Math.round(diffDays * productiveHoursPerDay * 10) / 10;
  }

  return {
    feasible:       availableHours >= hoursNeeded,
    availableHours,
    hoursNeeded,
    deficit:        Math.max(0, Math.round((hoursNeeded - availableHours) * 10) / 10),
    daysUntil:      Math.ceil(diffDays),
  };
}
