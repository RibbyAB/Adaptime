export const SLOT_DEFINITIONS = [
  { key: 'morning',   startH: 6,  endH: 12, label: 'Pagi',  icon: '🌅' },
  { key: 'afternoon', startH: 12, endH: 17, label: 'Siang', icon: '☀️' },
  { key: 'evening',   startH: 17, endH: 20, label: 'Sore',  icon: '🌆' },
  { key: 'night',     startH: 20, endH: 24, label: 'Malam', icon: '🌙' },
];

export const DAYS = ['Senin','Selasa','Rabu','Kamis','Jumat','Sabtu','Minggu'];

const SLOT_TOTAL = { morning: 6, afternoon: 5, evening: 3, night: 4 };

function bufferHours(difficulty) {
  if (difficulty <= 2) return 0.25;   // 15 min
  if (difficulty === 3) return 0.33;  // 20 min
  return 0.5;                          // 30 min for diff 4–5
}

function calcDrain(difficulty, currentEnergy) {
  const baseDrain = difficulty <= 2 ? 0.15 : difficulty === 3 ? 0.25 : 0.40;
  const diminish = 0.5 + (currentEnergy / 5) * 0.5;
  return baseDrain * diminish;
}

function fixedDrain(difficulty, durationHours, currentEnergy) {
  const perHourBase = difficulty <= 2 ? 0.08 : difficulty === 3 ? 0.12 : 0.20;
  const diminish = 0.5 + (currentEnergy / 5) * 0.5;
  return Math.min(perHourBase * durationHours * diminish, 0.9);
}

export function formatHour(h) {
  const hour = Math.floor(h);
  const min  = Math.round((h - hour) * 60);
  return `${String(hour).padStart(2,'0')}:${String(min).padStart(2,'0')}`;
}

function isoDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function dayKey(dayName, dateStr) { return `${dayName}__${dateStr}`; }

function buildBlocked(fixedSchedules, today, lookaheadDays) {
  const blocked = {};

  for (let i = 0; i < lookaheadDays; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const jsDay  = date.getDay();
    const dName  = DAYS[jsDay === 0 ? 6 : jsDay - 1];
    const dISO   = isoDate(date);
    const dk     = dayKey(dName, dISO);

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
    let energy = ((baseEnergy && baseEnergy[slot.key]) || 3) / 5;
    const fixedInSlot = (blockedForDay || []).filter(
      b => b.start < slot.endH && b.end > slot.startH
    );
    for (const fix of fixedInSlot) {
      const overlap = Math.min(fix.end, slot.endH) - Math.max(fix.start, slot.startH);
      energy -= fixedDrain(fix.difficulty, overlap, energy * 5);
      energy  = Math.max(energy, 0.05); // never fully zero
    }
    slotEnergy[slot.key] = energy; // 0–1
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
 * Main scheduler
 * @param {Array}  tasks
 * @param {Array}  fixedSchedules
 * @param {Object} energy
 * @param {string} todayISO
 * @param {number} lookaheadDays
 * @param {Object} workCapOverride
 * @returns {{ scheduled: Array, warnings: Array }}
 */
export function runScheduler(
  tasks,
  fixedSchedules,
  energy,
  todayISO,
  lookaheadDays = 14,
  workCapOverride = {}
) {
  if (!energy || !tasks || !fixedSchedules) return { scheduled: [], warnings: [] };
  const today  = new Date(todayISO + 'T00:00:00');
  const result = [];
  const warnings = [];

  const sortedTasks = [...tasks]
    .filter(t => t.status === 'pending' || t.status === 'in-progress')
    .sort((a, b) => {
      const da = new Date(a.deadline);
      const db = new Date(b.deadline);
      if (da - db !== 0) return da - db;
      return b.difficulty - a.difficulty;
    });

  const blocked = buildBlocked(fixedSchedules, today, lookaheadDays);

  const dayState = {};

  const initDayState = (dk, dateISO) => {
    if (dayState[dk]) return;
    const cap = workCapOverride[dateISO] ?? 8;
    const slotEnergy = buildSlotEnergy(blocked[dk], energy);

    const slotCursors = {};
    for (const slot of SLOT_DEFINITIONS) {
      let cursor = slot.startH;
      const fixedInSlot = (blocked[dk] || [])
        .filter(b => b.start < slot.endH && b.end > slot.startH)
        .sort((a, b) => a.start - b.start);
      slotCursors[slot.key] = cursor;
    }

    dayState[dk] = { workHoursUsed: 0, slotCursors, slotEnergy, cap };
  };

  for (const task of sortedTasks) {
    const totalTaskHours = task.hours || 1;
    const prefSessionH   = task.prefSessionHours || null;
    let hoursLeft = totalTaskHours;

    const deadline = new Date(task.deadline + 'T23:59:59');
    const daysUntilDeadline = Math.ceil((deadline - today) / 86400000);
    const daysAvailable = Math.min(Math.max(1, daysUntilDeadline), lookaheadDays);

    const MIN_SESSION = 0.25;
    const MAX_SESSION = prefSessionH || 3;

    const taskSessions = [];

    const rankedSlots = [...SLOT_DEFINITIONS].sort((a, b) => {
      const eA = (energy && energy[a.key]) || 3;
      const eB = (energy && energy[b.key]) || 3;
      const diffA = Math.abs(task.difficulty - eA);
      const diffB = Math.abs(task.difficulty - eB);
      const scoreA = (diffA === 0 ? 5 : diffA === 1 ? 3 : 1) + (a.key === task.timePref ? 1 : 0);
      const scoreB = (diffB === 0 ? 5 : diffB === 1 ? 3 : 1) + (b.key === task.timePref ? 1 : 0);
      return scoreB - scoreA;
    });

    for (let dayOffset = 0; dayOffset < daysAvailable && hoursLeft >= MIN_SESSION; dayOffset++) {
      const date = new Date(today);
      date.setDate(today.getDate() + dayOffset);
      const jsDay  = date.getDay();
      const dName  = DAYS[jsDay === 0 ? 6 : jsDay - 1];
      const dISO   = isoDate(date);
      const dk     = dayKey(dName, dISO);

      initDayState(dk, dISO);
      const ds = dayState[dk];

      if (ds.workHoursUsed >= ds.cap) continue;

      for (const slot of rankedSlots) {
        if (hoursLeft < MIN_SESSION) break;
        if (ds.workHoursUsed >= ds.cap) break;

        const currentEnergy = ds.slotEnergy[slot.key];
        if (currentEnergy < 0.05) continue;

        const capRemaining   = ds.cap - ds.workHoursUsed;
        const slotRemaining  = slot.endH - ds.slotCursors[slot.key];
        if (slotRemaining < MIN_SESSION) continue;

        let sessionH = Math.min(hoursLeft, capRemaining, slotRemaining, MAX_SESSION);
        if (sessionH < MIN_SESSION) continue;

        const startH = getNextFreeWindow(slot, blocked[dk], ds.slotCursors[slot.key], sessionH);
        if (startH === null) continue;

        const actualRoom = Math.min(slot.endH, startH + sessionH) - startH;

        const overlaps = (blocked[dk] || []).some(
          b => startH < b.end && (startH + actualRoom) > b.start
        );
        if (overlaps) continue;

        const finalSessionH = Math.min(actualRoom, sessionH);
        if (finalSessionH < MIN_SESSION) continue;

        const buffer = bufferHours(task.difficulty);

        taskSessions.push({
          taskId:        task.id,
          taskName:      task.name,
          difficulty:    task.difficulty,
          day:           dName,
          date:          dISO,
          slotKey:       slot.key,
          slotLabel:     slot.label,
          slotIcon:      slot.icon,
          startH,
          endH:          startH + finalSessionH,
          sessionNum:    0,
          totalSessions: 0,
          energyLevel:   Math.round(currentEnergy * 5 * 10) / 10,
          isDone:        false,
          note:          '',
          checklist:     [],
        });

        ds.slotCursors[slot.key] = startH + finalSessionH + buffer;
        ds.workHoursUsed += finalSessionH;

        const drain = calcDrain(task.difficulty, currentEnergy * 5);
        ds.slotEnergy[slot.key] = Math.max(currentEnergy - drain, 0.05);

        hoursLeft -= finalSessionH;
      }
    }

    taskSessions.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.startH - b.startH;
    });

    const totalSessions = taskSessions.length;
    taskSessions.forEach((s, i) => {
      s.sessionNum    = i + 1;
      s.totalSessions = totalSessions;
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

  return { scheduled: result, warnings };
}

export { SLOT_DEFINITIONS as SLOTS };
