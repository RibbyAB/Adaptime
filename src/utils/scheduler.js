import { checkFeasibility } from './helpers';

export const SLOT_DEFINITIONS = [
  { key: 'morning',   startH: 6,  endH: 12, label: 'Pagi',  icon: '🌅' },
  { key: 'afternoon', startH: 12, endH: 17, label: 'Siang', icon: '☀️' },
  { key: 'evening',   startH: 17, endH: 20, label: 'Sore',  icon: '🌆' },
  { key: 'night',     startH: 20, endH: 24, label: 'Malam', icon: '🌙' },
];

export const DAYS = ['Senin','Selasa','Rabu','Kamis','Jumat','Sabtu','Minggu'];

const SLOT_TOTAL = { morning: 6, afternoon: 5, evening: 3, night: 4 };

function bufferHours(difficulty) {
  if (difficulty <= 2) return 0.25;
  if (difficulty === 3) return 0.33;
  return 0.5;
}

function calcDrain(difficulty, currentEnergy) {
  const baseDrain = difficulty <= 2 ? 0.15 : difficulty === 3 ? 0.25 : 0.40;
  const diminish  = 0.5 + (currentEnergy / 5) * 0.5;
  return baseDrain * diminish;
}

function fixedDrain(difficulty, durationHours, currentEnergy) {
  const perHourBase = difficulty <= 2 ? 0.08 : difficulty === 3 ? 0.12 : 0.20;
  const diminish    = 0.5 + (currentEnergy / 5) * 0.5;
  return Math.min(perHourBase * durationHours * diminish, 0.9);
}

export function formatHour(h) {
  const hour = Math.floor(h);
  const min  = Math.round((h - hour) * 60);
  return `${String(hour).padStart(2,'0')}:${String(min).padStart(2,'0')}`;
}

function isoDate(d) {
  const y   = d.getFullYear();
  const m   = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function dayKey(dayName, dateStr) { return `${dayName}__${dateStr}`; }

function buildBlocked(fixedSchedules, today, lookaheadDays) {
  const blocked = {};
  for (let i = 0; i < lookaheadDays; i++) {
    const date  = new Date(today);
    date.setDate(today.getDate() + i);
    const jsDay = date.getDay();
    const dName = DAYS[jsDay === 0 ? 6 : jsDay - 1];
    const dISO  = isoDate(date);
    const dk    = dayKey(dName, dISO);
    fixedSchedules
      .filter(s => s.day === dName)
      .forEach(s => {
        const [sh, sm] = s.startTime.split(':').map(Number);
        const [eh, em] = s.endTime.split(':').map(Number);
        if (!blocked[dk]) blocked[dk] = [];
        blocked[dk].push({ start: sh + sm/60, end: eh + em/60, difficulty: s.difficulty || 3 });
      });
  }
  return blocked;
}

function buildSlotEnergy(blockedForDay, baseEnergy) {
  const slotEnergy = {};
  for (const slot of SLOT_DEFINITIONS) {
    let energy      = ((baseEnergy && baseEnergy[slot.key]) || 3) / 5;
    const fixedInSlot = (blockedForDay || []).filter(
      b => b.start < slot.endH && b.end > slot.startH
    );
    for (const fix of fixedInSlot) {
      const overlap = Math.min(fix.end, slot.endH) - Math.max(fix.start, slot.startH);
      energy -= fixedDrain(fix.difficulty, overlap, energy * 5);
      energy  = Math.max(energy, 0.05);
    }
    slotEnergy[slot.key] = energy;
  }
  return slotEnergy;
}

function getNextFreeWindow(slot, blocked, cursor, neededHours) {
  let start = Math.max(cursor, slot.startH);
  const sortedBlocked = [...(blocked || [])]
    .filter(b => b.end > slot.startH && b.start < slot.endH)
    .sort((a, b) => a.start - b.start);
  for (const b of sortedBlocked) {
    if (start + neededHours <= b.start) break;
    if (start < b.end) start = b.end;
  }
  if (start + neededHours > slot.endH) return null;
  return start;
}

/**
 * Find the next available slot for a catch-up session (past-due un-done session).
 * Used when a user un-checks a session whose time has already passed.
 * Returns { date, slotKey, startH, endH } or null if nothing fits in lookahead.
 */
export function findNextAvailableSlot(
  hoursNeeded,
  fixedSchedules,
  energy,
  existingSessions,
  todayISO,
  lookaheadDays = 14,
  workCapOverride = {}
) {
  if (!energy || hoursNeeded <= 0) return null;
  const today   = new Date(todayISO + 'T00:00:00');
  const blocked = buildBlocked(fixedSchedules, today, lookaheadDays);
  const now     = new Date();
  const nowHour = now.getHours() + now.getMinutes() / 60;

  for (let dayOffset = 0; dayOffset < lookaheadDays; dayOffset++) {
    const date  = new Date(today);
    date.setDate(today.getDate() + dayOffset);
    const jsDay = date.getDay();
    const dName = DAYS[jsDay === 0 ? 6 : jsDay - 1];
    const dISO  = isoDate(date);
    const dk    = dayKey(dName, dISO);
    const cap   = workCapOverride[dISO] ?? 8;

    // Work hours already used by existing sessions on this day
    const daySessionsHours = existingSessions
      .filter(s => s.date === dISO)
      .reduce((acc, s) => acc + (s.endH - s.startH), 0);
    if (daySessionsHours >= cap) continue;

    const slotEnergy = buildSlotEnergy(blocked[dk], energy);

    // Build cursors from existing sessions
    const cursors = {};
    for (const slot of SLOT_DEFINITIONS) {
      cursors[slot.key] = slot.startH;
      // Advance past fixed schedules
      (blocked[dk] || [])
        .filter(b => b.start < slot.endH && b.end > slot.startH)
        .forEach(b => { if (b.end > cursors[slot.key]) cursors[slot.key] = b.end; });
      // Advance past existing sessions in this slot
      existingSessions
        .filter(s => s.date === dISO && s.slotKey === slot.key)
        .sort((a, b) => a.startH - b.startH)
        .forEach(s => { if (s.endH > cursors[slot.key]) cursors[slot.key] = s.endH + bufferHours(s.difficulty || 3); });
    }

    for (const slot of SLOT_DEFINITIONS) {
      if (slotEnergy[slot.key] < 0.05) continue;
      const cursor        = dayOffset === 0 ? Math.max(cursors[slot.key], nowHour) : cursors[slot.key];
      const slotRemaining = slot.endH - cursor;
      if (slotRemaining < 0.25) continue;

      const sessionH = Math.min(hoursNeeded, slotRemaining, 3);
      if (sessionH < 0.25) continue;

      const startH = getNextFreeWindow(slot, blocked[dk], cursor, sessionH);
      if (startH === null) continue;

      return {
        date:     dISO,
        day:      dName,
        slotKey:  slot.key,
        slotLabel: slot.label,
        slotIcon:  slot.icon,
        startH,
        endH:     startH + sessionH,
        energyLevel: Math.round(slotEnergy[slot.key] * 5 * 10) / 10,
      };
    }
  }
  return null;
}

/**
 * Main scheduler
 * @param {Array}  tasks
 * @param {Array}  fixedSchedules
 * @param {Object} energy
 * @param {string} todayISO
 * @param {number} lookaheadDays
 * @param {Object} workCapOverride
 * @param {string} overduePriority - 'unset' | 'overdue' | 'current'
 * @param {Array}  existingSessions - for preserving isDone/note/checklist
 * @returns {{ scheduled: Array, warnings: Array, infeasibleTaskIds: Array }}
 */
export function runScheduler(
  tasks,
  fixedSchedules,
  energy,
  todayISO,
  lookaheadDays    = 14,
  workCapOverride  = {},
  overduePriority  = 'unset',
  existingSessions = []
) {
  if (!energy || !tasks || !fixedSchedules) return { scheduled: [], warnings: [], infeasibleTaskIds: [] };

  const today          = new Date(todayISO + 'T00:00:00');
  const result         = [];
  const warnings       = [];
  const infeasibleTaskIds = [];
  const nowDate        = new Date();
  const nowISO         = isoDate(nowDate);
  const nowHour        = nowDate.getHours() + nowDate.getMinutes() / 60;
  const nowHourRounded = Math.ceil(nowHour * 2) / 2;

  // Build session state lookup for preservation: taskId+sessionNum+date → session
  const sessionStateMap = {};
  existingSessions.forEach(s => {
    const key = `${s.taskId}__${s.sessionNum}__${s.date}`;
    sessionStateMap[key] = { isDone: s.isDone, note: s.note, checklist: s.checklist };
  });

  // ── Feasibility pre-filter ──────────────────────────────────────────────────
  const activeTasks = [...tasks].filter(t => {
    if (t.status !== 'pending' && t.status !== 'in-progress') return false;

    // Compute done hours from existing sessions for this task
    const doneHours = existingSessions
      .filter(s => s.taskId === t.id && s.isDone)
      .reduce((acc, s) => acc + (s.endH - s.startH), 0);

    const remainingHours = Math.max(0, (t.hours || 1) - doneHours);
    if (remainingHours <= 0) return false; // fully done via sessions

    const { feasible } = checkFeasibility(t.deadline, remainingHours);
    if (!feasible) {
      infeasibleTaskIds.push(t.id);
      // If overdue priority is set, still schedule them (past deadline)
      if (overduePriority === 'overdue') return true;
      return false;
    }
    return true;
  });

  // ── Sort based on priority setting ─────────────────────────────────────────
  activeTasks.sort((a, b) => {
    const aOverdue = infeasibleTaskIds.includes(a.id);
    const bOverdue = infeasibleTaskIds.includes(b.id);

    if (overduePriority === 'overdue') {
      if (aOverdue && !bOverdue) return -1;
      if (!aOverdue && bOverdue) return 1;
    } else if (overduePriority === 'current') {
      if (aOverdue && !bOverdue) return 1;
      if (!aOverdue && bOverdue) return -1;
    }

    const da = new Date(a.deadline);
    const db = new Date(b.deadline);
    if (da - db !== 0) return da - db;
    return b.difficulty - a.difficulty;
  });

  const blocked = buildBlocked(fixedSchedules, today, lookaheadDays);
  const dayState = {};

  const initDayState = (dk, dateISO) => {
    if (dayState[dk]) return;
    const cap        = workCapOverride[dateISO] ?? 8;
    const slotEnergy = buildSlotEnergy(blocked[dk], energy);
    const slotCursors = {};
    for (const slot of SLOT_DEFINITIONS) {
      slotCursors[slot.key] = slot.startH;
    }
    dayState[dk] = { workHoursUsed: 0, slotCursors, slotEnergy, cap };
  };

  for (const task of activeTasks) {
    // Compute remaining hours (subtract done sessions)
    const doneHours = existingSessions
      .filter(s => s.taskId === task.id && s.isDone)
      .reduce((acc, s) => acc + (s.endH - s.startH), 0);

    const totalTaskHours = Math.max(0, (task.hours || 1) - doneHours);
    const prefSessionH   = task.prefSessionHours || null;
    let hoursLeft        = totalTaskHours;

    const isOverdue     = infeasibleTaskIds.includes(task.id);
    const deadline      = new Date((isOverdue && overduePriority === 'overdue')
      ? isoDate(new Date(Date.now() + 86400000 * lookaheadDays)) + 'T23:59:59'
      : task.deadline + 'T23:59:59');
    const daysUntilDeadline = Math.ceil((deadline - today) / 86400000);
    const daysAvailable     = Math.min(Math.max(1, daysUntilDeadline), lookaheadDays);

    const MIN_SESSION = 0.25;
    const MAX_SESSION = prefSessionH || 3;
    const taskSessions = [];

    const rankedSlots = [...SLOT_DEFINITIONS].sort((a, b) => {
      const eA        = (energy && energy[a.key]) || 3;
      const eB        = (energy && energy[b.key]) || 3;
      const diffA     = Math.abs(task.difficulty - eA);
      const diffB     = Math.abs(task.difficulty - eB);
      const prefBoostA = task.timePref === 'anytime' ? 0 : (a.key === task.timePref ? 1 : 0);
      const prefBoostB = task.timePref === 'anytime' ? 0 : (b.key === task.timePref ? 1 : 0);
      const scoreA    = (diffA === 0 ? 5 : diffA === 1 ? 3 : 1) + prefBoostA;
      const scoreB    = (diffB === 0 ? 5 : diffB === 1 ? 3 : 1) + prefBoostB;
      return scoreB - scoreA;
    });

    for (let dayOffset = 0; dayOffset < daysAvailable && hoursLeft >= MIN_SESSION; dayOffset++) {
      const date  = new Date(today);
      date.setDate(today.getDate() + dayOffset);
      const jsDay = date.getDay();
      const dName = DAYS[jsDay === 0 ? 6 : jsDay - 1];
      const dISO  = isoDate(date);
      const dk    = dayKey(dName, dISO);

      initDayState(dk, dISO);
      const ds = dayState[dk];
      if (ds.workHoursUsed >= ds.cap) continue;

      const taskCreatedToday  = dISO === nowISO && task.createdAt &&
        isoDate(new Date(task.createdAt)) === nowISO;
      const effectiveMinStart = taskCreatedToday ? nowHourRounded : 0;

      for (const slot of rankedSlots) {
        if (hoursLeft < MIN_SESSION) break;
        if (ds.workHoursUsed >= ds.cap) break;

        const currentEnergy   = ds.slotEnergy[slot.key];
        if (currentEnergy < 0.05) continue;

        const capRemaining    = ds.cap - ds.workHoursUsed;
        const effectiveCursor = Math.max(ds.slotCursors[slot.key], effectiveMinStart);
        const slotRemaining   = slot.endH - effectiveCursor;
        if (slotRemaining < MIN_SESSION) continue;

        let sessionH = Math.min(hoursLeft, capRemaining, slotRemaining, MAX_SESSION);
        if (sessionH < MIN_SESSION) continue;

        const startH = getNextFreeWindow(slot, blocked[dk], effectiveCursor, sessionH);
        if (startH === null) continue;

        const actualRoom = Math.min(slot.endH, startH + sessionH) - startH;
        const overlaps   = (blocked[dk] || []).some(
          b => startH < b.end && (startH + actualRoom) > b.start
        );
        if (overlaps) continue;

        const finalSessionH = Math.min(actualRoom, sessionH);
        if (finalSessionH < MIN_SESSION) continue;

        taskSessions.push({
          taskId:       task.id,
          taskName:     task.name,
          difficulty:   task.difficulty,
          day:          dName,
          date:         dISO,
          slotKey:      slot.key,
          slotLabel:    slot.label,
          slotIcon:     slot.icon,
          startH,
          endH:         startH + finalSessionH,
          sessionNum:   0,
          totalSessions: 0,
          energyLevel:  Math.round(currentEnergy * 5 * 10) / 10,
          isDone:       false,
          note:         '',
          checklist:    [],
        });

        ds.slotCursors[slot.key] = startH + finalSessionH + bufferHours(task.difficulty);
        ds.workHoursUsed        += finalSessionH;
        const drain              = calcDrain(task.difficulty, currentEnergy * 5);
        ds.slotEnergy[slot.key]  = Math.max(currentEnergy - drain, 0.05);
        hoursLeft               -= finalSessionH;
      }
    }

    // Sort sessions chronologically before numbering
    taskSessions.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.startH - b.startH;
    });

    const totalSessions = taskSessions.length;
    taskSessions.forEach((s, i) => {
      s.sessionNum    = i + 1;
      s.totalSessions = totalSessions;

      // ── Preserve session state (isDone, note, checklist) ──────────────────
      // Match by taskId + sessionNum + date so done sessions survive reschedule
      const stateKey = `${s.taskId}__${s.sessionNum}__${s.date}`;
      const preserved = sessionStateMap[stateKey];
      if (preserved) {
        s.isDone    = preserved.isDone    ?? false;
        s.note      = preserved.note      ?? '';
        s.checklist = preserved.checklist ?? [];
      }

      result.push(s);
    });

    if (hoursLeft >= MIN_SESSION) {
      warnings.push({
        taskId:           task.id,
        taskName:         task.name,
        hoursUnscheduled: Math.round(hoursLeft * 10) / 10,
      });
    }
  }

  return { scheduled: result, warnings, infeasibleTaskIds };
}

export { SLOT_DEFINITIONS as SLOTS };
