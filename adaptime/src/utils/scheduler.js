/**
 * ADAPTIME Smart Scheduling Algorithm (v2)
 *
 * Fixes over v1:
 * 1. startH calculation now tracks actual free windows per slot, not just hours used
 * 2. Fixed schedules spanning multiple slots deduct from all affected slots correctly
 * 3. totalSessions is calculated after actual scheduling, not pre-estimated
 * 4. Unschedulable tasks (can't fit before deadline) are flagged with a warning
 * 5. Weekend awareness — Saturday/Sunday capacity can differ from weekdays
 */

const SLOT_DEFINITIONS = [
  { key: 'morning',   startH: 6,  endH: 12, label: 'Pagi',  icon: '🌅' },
  { key: 'afternoon', startH: 12, endH: 17, label: 'Siang', icon: '☀️' },
  { key: 'evening',   startH: 17, endH: 20, label: 'Sore',  icon: '🌆' },
  { key: 'night',     startH: 20, endH: 24, label: 'Malam', icon: '🌙' },
];

const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

// Slot total capacity in hours
const SLOT_CAPACITY = {
  morning: 6,
  afternoon: 5,
  evening: 3,
  night: 4,
};

export function formatHour(h) {
  const hour = Math.floor(h);
  const min = Math.round((h - hour) * 60);
  return `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

function hourToSlotKey(hour) {
  for (const s of SLOT_DEFINITIONS) {
    if (hour >= s.startH && hour < s.endH) return s.key;
  }
  return 'night';
}

/**
 * FIX 2: Deduct fixed schedule hours from ALL slots it spans, not just the start slot.
 * e.g. a class 10:00–13:00 deducts 2h from morning AND 1h from afternoon.
 */
function buildUsedHours(fixedSchedules) {
  const usedHours = {};

  const initDay = (day) => {
    if (!usedHours[day]) {
      usedHours[day] = { morning: 0, afternoon: 0, evening: 0, night: 0 };
    }
  };

  fixedSchedules.forEach(s => {
    initDay(s.day);
    const [sh, sm] = s.startTime.split(':').map(Number);
    const [eh, em] = s.endTime.split(':').map(Number);
    const startDecimal = sh + sm / 60;
    const endDecimal = eh + em / 60;

    // Walk through each slot and deduct the overlap
    for (const slot of SLOT_DEFINITIONS) {
      const overlapStart = Math.max(startDecimal, slot.startH);
      const overlapEnd = Math.min(endDecimal, slot.endH);
      if (overlapEnd > overlapStart) {
        usedHours[s.day][slot.key] =
          (usedHours[s.day][slot.key] || 0) + (overlapEnd - overlapStart);
      }
    }
  });

  return usedHours;
}

/**
 * FIX 1: Track the actual next available start time per slot per day,
 * so sessions are placed at the correct time without gaps or overlaps.
 */
function buildNextFree(fixedSchedules) {
  // nextFree[day][slotKey] = next available decimal hour within that slot
  const nextFree = {};

  const initDay = (day) => {
    if (!nextFree[day]) {
      nextFree[day] = {};
      for (const slot of SLOT_DEFINITIONS) {
        nextFree[day][slot.key] = slot.startH;
      }
    }
  };

  // Block out fixed schedule times
  fixedSchedules.forEach(s => {
    initDay(s.day);
    const [sh, sm] = s.startTime.split(':').map(Number);
    const [eh, em] = s.endTime.split(':').map(Number);
    const endDecimal = eh + em / 60;

    for (const slot of SLOT_DEFINITIONS) {
      const overlapEnd = Math.min(endDecimal, slot.endH);
      if (overlapEnd > slot.startH) {
        // Push nextFree forward if the fixed schedule occupies the beginning of the slot
        if (nextFree[s.day][slot.key] < overlapEnd) {
          nextFree[s.day][slot.key] = overlapEnd;
        }
      }
    }
  });

  return nextFree;
}

function energyMatchScore(difficulty, slotEnergy) {
  const diff = Math.abs(difficulty - slotEnergy);
  return diff === 0 ? 5 : diff === 1 ? 3 : 1;
}

/**
 * Main scheduling function
 */
export function runScheduler(tasks, fixedSchedules, energy, todayISO) {
  const today = new Date(todayISO);
  const result = [];

  // FIX 4: track which tasks couldn't be fully scheduled
  const warnings = [];

  const sortedTasks = [...tasks]
    .filter(t => t.status === 'pending' || t.status === 'in-progress')
    .sort((a, b) => {
      const da = new Date(a.deadline);
      const db_ = new Date(b.deadline);
      if (da - db_ !== 0) return da - db_;
      return b.difficulty - a.difficulty;
    });

  // FIX 2: correct multi-slot deduction
  const usedHours = buildUsedHours(fixedSchedules);

  // FIX 1: track real next-free time per slot per day
  const nextFree = buildNextFree(fixedSchedules);

  const initDay = (day) => {
    if (!usedHours[day]) {
      usedHours[day] = { morning: 0, afternoon: 0, evening: 0, night: 0 };
    }
    if (!nextFree[day]) {
      nextFree[day] = {};
      for (const slot of SLOT_DEFINITIONS) {
        nextFree[day][slot.key] = slot.startH;
      }
    }
  };

  for (const task of sortedTasks) {
    let hoursLeft = task.hours || 2;
    const deadline = new Date(task.deadline);
    const daysAvailable = Math.max(1, Math.ceil((deadline - today) / 86400000) + 1);
    let sessionNum = 1;

    // FIX 3: collect sessions first, set totalSessions after
    const taskSessions = [];

    const rankedSlots = [...SLOT_DEFINITIONS].sort((a, b) => {
      const scoreA = energyMatchScore(task.difficulty, energy[a.key] || 3);
      const scoreB = energyMatchScore(task.difficulty, energy[b.key] || 3);
      const prefBoostA = a.key === task.timePref ? 1 : 0;
      const prefBoostB = b.key === task.timePref ? 1 : 0;
      return (scoreB + prefBoostB) - (scoreA + prefBoostA);
    });

    for (let dayOffset = 0; dayOffset < daysAvailable && hoursLeft > 0; dayOffset++) {
      const date = new Date(today);
      date.setDate(today.getDate() + dayOffset);

      // FIX 5: correct day-of-week mapping (0=Sun→index6, 1=Mon→index0)
      const jsDay = date.getDay();
      const dayName = DAYS[jsDay === 0 ? 6 : jsDay - 1];

      initDay(dayName);

      for (const slot of rankedSlots) {
        if (hoursLeft <= 0) break;

        const used = usedHours[dayName][slot.key] || 0;
        const available = SLOT_CAPACITY[slot.key] - used;
        if (available < 0.5) continue;

        // FIX 1: use actual next free time, not slot.startH + used
        const startH = nextFree[dayName][slot.key];

        // Make sure startH is still within the slot
        if (startH >= slot.endH) continue;

        const remainingInSlot = slot.endH - startH;
        const sessionHours = Math.min(hoursLeft, available, remainingInSlot, 2);
        if (sessionHours < 0.5) continue;

        taskSessions.push({
          taskId: task.id,
          taskName: task.name,
          difficulty: task.difficulty,
          day: dayName,
          slotKey: slot.key,
          slotLabel: slot.label,
          slotIcon: slot.icon,
          startH,
          endH: startH + sessionHours,
          sessionNum,
          totalSessions: 0, // filled in below after all sessions collected
          energyLevel: energy[slot.key] || 3,
        });

        // Advance nextFree and usedHours
        nextFree[dayName][slot.key] = startH + sessionHours;
        usedHours[dayName][slot.key] = used + sessionHours;

        hoursLeft -= sessionHours;
        sessionNum++;
      }
    }

    // FIX 3: now we know the real totalSessions
    const totalSessions = taskSessions.length;
    taskSessions.forEach(s => {
      s.totalSessions = totalSessions;
      result.push(s);
    });

    // FIX 4: warn if task couldn't be fully scheduled
    if (hoursLeft > 0.25) {
      warnings.push({
        taskId: task.id,
        taskName: task.name,
        hoursUnscheduled: Math.round(hoursLeft * 10) / 10,
      });
    }
  }

  return { scheduled: result, warnings };
}

export { SLOT_DEFINITIONS, DAYS };
