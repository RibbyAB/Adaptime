/**
 * scheduler.test.js
 * Unit tests for the past-slot guard in runScheduler.
 *
 * Run with:  npx vitest  (atau npx jest jika project pakai Jest)
 *
 * Semua test menggunakan nowMs eksplisit agar hasilnya deterministik
 * dan tidak bergantung pada waktu sistem saat test dijalankan.
 */

import { describe, it, expect } from 'vitest';
import { runScheduler } from './scheduler';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Buat tanggal ISO dari Date object */
const iso = (d) => d.toISOString().slice(0, 10);

/** Buat timestamp ms untuk hari ini jam H:M */
const todayAt = (h, m = 0) => {
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.getTime();
};

/** Buat tanggal ISO N hari ke depan dari sekarang */
const inDays = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return iso(d);
};

/** Energi default (semua slot sedang) */
const DEFAULT_ENERGY = {
  morning: 3, afternoon: 3, evening: 3, night: 3, pref: 'morning',
};

/** Task minimal */
const makeTask = (overrides) => ({
  id:         'task-1',
  name:       'Test Task',
  status:     'pending',
  difficulty: 3,
  hours:      2,
  deadline:   inDays(7),
  timePref:   'morning',
  assignedAt: todayAt(8),   // default: dibuat jam 08:00 hari ini
  ...overrides,
});

// ─── Test Suite ───────────────────────────────────────────────────────────────

describe('Past-slot guard', () => {

  /**
   * Case 1 — Assign task di tengah hari (pukul 15:00)
   * Preferensi: morning. Morning slot 06:00–12:00 sudah lewat.
   * Harapan: tidak ada session yang startH < 15.
   */
  it('Case 1: tidak menjadwalkan slot pagi ketika task dibuat jam 15:00', () => {
    const nowMs   = todayAt(15, 0);          // sekarang 15:00
    const todayISO = iso(new Date());

    const task = makeTask({
      timePref:   'morning',
      assignedAt: nowMs,
      deadline:   inDays(3),
    });

    const { scheduled } = runScheduler(
      [task], [], DEFAULT_ENERGY, todayISO, 14, {}, nowMs
    );

    // Semua session di hari ini harus mulai >= 15.0
    const todaySessions = scheduled.filter(s => s.date === todayISO);
    todaySessions.forEach(s => {
      expect(s.startH).toBeGreaterThanOrEqual(15.0);
    });
  });

  /**
   * Case 2 — Assign task larut malam (pukul 23:00)
   * Hampir semua slot sudah habis. Scheduler harus pindah ke hari berikutnya.
   */
  it('Case 2: larut malam — scheduler pindah ke hari berikutnya', () => {
    const nowMs    = todayAt(23, 0);
    const todayISO = iso(new Date());
    const tomorrow = inDays(1);

    const task = makeTask({
      assignedAt: nowMs,
      deadline:   inDays(5),
      hours:      3,
    });

    const { scheduled } = runScheduler(
      [task], [], DEFAULT_ENERGY, todayISO, 14, {}, nowMs
    );

    // Tidak boleh ada session di hari ini sebelum jam 23:00
    const todaySessions = scheduled.filter(s => s.date === todayISO);
    todaySessions.forEach(s => {
      expect(s.startH).toBeGreaterThanOrEqual(23.0);
    });

    // Harus ada setidaknya 1 session di hari berikutnya atau setelahnya
    const futureSessions = scheduled.filter(s => s.date >= tomorrow);
    expect(futureSessions.length).toBeGreaterThan(0);
  });

  /**
   * Case 3 — Assign setelah preferred time window sudah lewat
   * Preferensi: evening (17:00–20:00), task dibuat jam 21:00.
   * Evening sudah habis → scheduler harus ke slot lain atau hari berikutnya.
   */
  it('Case 3: preferred slot sudah lewat — scheduler fallback ke slot berikutnya', () => {
    const nowMs    = todayAt(21, 0);          // 21:00, evening (17–20) sudah lewat
    const todayISO = iso(new Date());

    const task = makeTask({
      timePref:   'evening',
      assignedAt: nowMs,
      deadline:   inDays(4),
      hours:      2,
    });

    const { scheduled } = runScheduler(
      [task], [], DEFAULT_ENERGY, todayISO, 14, {}, nowMs
    );

    // Tidak boleh ada session yang startH < 21
    const todaySessions = scheduled.filter(s => s.date === todayISO);
    todaySessions.forEach(s => {
      expect(s.startH).toBeGreaterThanOrEqual(21.0);
    });

    // Total jam yang dijadwalkan harus >= 2
    const totalScheduled = scheduled.reduce((sum, s) => sum + (s.endH - s.startH), 0);
    expect(totalScheduled).toBeGreaterThanOrEqual(2);
  });

  /**
   * Case 4 — Task durasi panjang (9 jam) melintasi beberapa hari
   * Dibuat jam 15:00. Satu hari tidak cukup → harus split ke beberapa hari.
   * Semua session di hari penugasan harus startH >= 15.
   */
  it('Case 4: task 9 jam dibuat sore — split ke beberapa hari, tidak ada slot masa lalu', () => {
    const nowMs    = todayAt(15, 0);
    const todayISO = iso(new Date());

    const task = makeTask({
      timePref:   'night',
      assignedAt: nowMs,
      hours:      9,
      difficulty: 5,
      deadline:   inDays(6),
    });

    const { scheduled } = runScheduler(
      [task], [], DEFAULT_ENERGY, todayISO, 14, {}, nowMs
    );

    // Harus ada session (task belum lewat deadline)
    expect(scheduled.length).toBeGreaterThan(0);

    // Semua session di hari ini harus >= 15
    const todaySessions = scheduled.filter(s => s.date === todayISO);
    todaySessions.forEach(s => {
      expect(s.startH).toBeGreaterThanOrEqual(15.0);
    });

    // Session di hari lain tidak dibatasi (boleh mulai dari slot awal)
    const otherDays = scheduled.filter(s => s.date !== todayISO);
    expect(otherDays.length).toBeGreaterThan(0);
  });

  /**
   * Case 5 — Tidak boleh ada session dengan startH negatif atau < 0
   * (guard terhadap nilai cursor yang korup)
   */
  it('Case 5: tidak ada session dengan startH negatif atau < 0', () => {
    const nowMs    = todayAt(9, 30);
    const todayISO = iso(new Date());

    const tasks = [
      makeTask({ id: 'a', assignedAt: nowMs, hours: 1, deadline: inDays(1) }),
      makeTask({ id: 'b', assignedAt: nowMs, hours: 2, deadline: inDays(2) }),
      makeTask({ id: 'c', assignedAt: todayAt(0, 0), hours: 4, deadline: inDays(3) }),
    ];

    const { scheduled } = runScheduler(
      tasks, [], DEFAULT_ENERGY, todayISO, 14, {}, nowMs
    );

    scheduled.forEach(s => {
      expect(s.startH).toBeGreaterThanOrEqual(0);
      expect(s.endH).toBeGreaterThan(s.startH);
    });
  });

  /**
   * Case 6 — Task dibuat di hari yang berbeda (assignedAt kemarin)
   * Hari ini scheduler tidak dibatasi oleh waktu kemarin.
   */
  it('Case 6: task lama (assignedAt kemarin) tidak dibatasi di hari berikutnya', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(22, 0, 0, 0);

    const nowMs    = todayAt(8, 0);
    const todayISO = iso(new Date());

    const task = makeTask({
      assignedAt: yesterday.getTime(),  // dibuat kemarin jam 22
      hours:      2,
      deadline:   inDays(3),
    });

    const { scheduled } = runScheduler(
      [task], [], DEFAULT_ENERGY, todayISO, 14, {}, nowMs
    );

    // Hari ini, slot pagi (jam 8 dst.) harus tersedia — bukan dibatasi jam 22
    const todaySessions = scheduled.filter(s => s.date === todayISO);
    expect(todaySessions.length).toBeGreaterThan(0);
    todaySessions.forEach(s => {
      // harus >= nowHour (jam 8), bukan >= 22
      expect(s.startH).toBeGreaterThanOrEqual(8.0);
      expect(s.startH).toBeLessThan(22.0);  // tidak digeser ke jam 22 secara salah
    });
  });

});