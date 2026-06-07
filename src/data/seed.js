import { collection, addDoc, setDoc, doc, getDocs, query, where, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';

export const DAYS = ['Senin','Selasa','Rabu','Kamis','Jumat','Sabtu','Minggu'];

function isoDate(d) {
  const y   = d.getFullYear();
  const m   = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function todayPlus(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return isoDate(d);
}

function todayMinus(n) { return todayPlus(-n); }

export function getDemoTasks(uid) {
  return [
    {
      uid, name: 'Tugas Mandiri — Review Jurnal Internasional',
      deadline: todayMinus(2), difficulty: 3, status: 'overdue',
      timePref: 'morning', hours: 4,
      description: 'Review paper tentang cloud computing dan serverless architecture.',
      checklist: [{ id: 1, text: 'Baca paper', done: true }, { id: 2, text: 'Tulis ringkasan', done: false }],
      prefSessionHours: 2, createdAt: Date.now() - 86400000 * 5,
    },
    {
      uid, name: 'Latihan Soal Ujian — Pemrograman Lanjut',
      deadline: todayMinus(5), difficulty: 5, status: 'overdue',
      timePref: 'evening', hours: 6,
      description: 'Latihan soal persiapan ujian akhir semester materi rekursi dan struktur data.',
      checklist: [], prefSessionHours: 2, createdAt: Date.now() - 86400000 * 8,
    },
    {
      uid, name: 'Kerjakan Tugas Basis Data — ERD & Normalisasi',
      deadline: todayPlus(2), difficulty: 4, status: 'in-progress',
      timePref: 'morning', hours: 4,
      description: 'Buat ERD untuk sistem perpustakaan, lakukan normalisasi hingga 3NF, dan buat laporan.',
      checklist: [
        { id: 1, text: 'Identifikasi entitas dan atribut', done: true },
        { id: 2, text: 'Gambar ERD lengkap', done: true },
        { id: 3, text: 'Normalisasi 1NF → 2NF → 3NF', done: false },
        { id: 4, text: 'Tulis laporan normalisasi', done: false },
      ],
      prefSessionHours: 2, createdAt: Date.now(),
    },
    {
      uid, name: 'Laporan Praktikum Jaringan Komputer',
      deadline: todayPlus(3), difficulty: 3, status: 'pending',
      timePref: 'afternoon', hours: 3,
      description: 'Laporan praktikum konfigurasi VLAN dan routing statis di Cisco Packet Tracer.',
      checklist: [
        { id: 1, text: 'Screenshot hasil konfigurasi', done: false },
        { id: 2, text: 'Tulis analisis hasil', done: false },
        { id: 3, text: 'Kesimpulan dan lampiran', done: false },
      ],
      prefSessionHours: null, createdAt: Date.now(),
    },
    {
      uid, name: 'UTS Software Engineering — Belajar Materi',
      deadline: todayPlus(5), difficulty: 5, status: 'pending',
      timePref: 'morning', hours: 8,
      description: 'Review materi UML, design patterns, SDLC, testing, dan agile methodology.',
      checklist: [
        { id: 1, text: 'Review UML diagrams (use case, class, sequence)', done: false },
        { id: 2, text: 'Pelajari design patterns (Singleton, Factory, Observer)', done: false },
        { id: 3, text: 'SDLC models (Waterfall, Agile, Scrum)', done: false },
        { id: 4, text: 'Software testing strategies', done: false },
        { id: 5, text: 'Kerjakan soal latihan', done: false },
      ],
      prefSessionHours: 2, createdAt: Date.now(),
    },
    {
      uid, name: 'Quiz Kalkulus — Latihan Soal Integral',
      deadline: todayPlus(1), difficulty: 3, status: 'pending',
      timePref: 'evening', hours: 2,
      description: 'Latihan soal integral tak tentu, substitusi trigonometri, dan integrasi parsial.',
      checklist: [], prefSessionHours: 1, createdAt: Date.now(),
    },
    {
      uid, name: 'Proyek Web Programming — Frontend React',
      deadline: todayPlus(7), difficulty: 4, status: 'pending',
      timePref: 'morning', hours: 10,
      description: 'Implementasi halaman dashboard, manajemen state dengan Context API, dan integrasi REST API.',
      checklist: [
        { id: 1, text: 'Setup project dan routing', done: true },
        { id: 2, text: 'Komponen Header & Sidebar', done: true },
        { id: 3, text: 'Halaman Dashboard', done: false },
        { id: 4, text: 'Integrasi API', done: false },
        { id: 5, text: 'Styling dan responsiveness', done: false },
      ],
      prefSessionHours: 2, createdAt: Date.now(),
    },
    {
      uid, name: 'Membaca Paper — Machine Learning Dasar',
      deadline: todayPlus(4), difficulty: 2, status: 'pending',
      timePref: 'afternoon', hours: 2,
      description: 'Baca dan rangkum paper "A Few Useful Things to Know About Machine Learning".',
      checklist: [], prefSessionHours: null, createdAt: Date.now(),
    },
    {
      uid, name: 'Revisi Proposal Skripsi',
      deadline: todayPlus(6), difficulty: 4, status: 'pending',
      timePref: 'morning', hours: 5,
      description: 'Revisi BAB 1-3 berdasarkan feedback dosen pembimbing. Perbaiki rumusan masalah dan metodologi.',
      checklist: [
        { id: 1, text: 'Perbaiki latar belakang', done: false },
        { id: 2, text: 'Perbarui tinjauan pustaka', done: false },
        { id: 3, text: 'Revisi metodologi penelitian', done: false },
      ],
      prefSessionHours: 2, createdAt: Date.now(),
    },
    {
      uid, name: 'Olahraga — Renang atau Jogging',
      deadline: todayPlus(0), difficulty: 1, status: 'pending',
      timePref: 'evening', hours: 1,
      description: 'Rutin olahraga mingguan untuk menjaga kesehatan selama masa perkuliahan.',
      checklist: [], prefSessionHours: 1, createdAt: Date.now(),
    },
    {
      uid, name: 'Presentasi Kelompok — Sistem Terdistribusi',
      deadline: todayPlus(8), difficulty: 3, status: 'pending',
      timePref: 'afternoon', hours: 3,
      description: 'Persiapkan slide dan materi presentasi tentang konsep distributed systems dan CAP theorem.',
      checklist: [
        { id: 1, text: 'Riset materi CAP theorem', done: false },
        { id: 2, text: 'Buat slide presentasi', done: false },
        { id: 3, text: 'Latihan presentasi bersama kelompok', done: false },
      ],
      prefSessionHours: null, createdAt: Date.now(),
    },
    {
      uid, name: 'Tugas Algoritma — Sorting & Searching',
      deadline: todayMinus(2), difficulty: 3, status: 'done',
      timePref: 'morning', hours: 3,
      description: 'Implementasi bubble sort, merge sort, dan binary search dalam Python.',
      checklist: [], prefSessionHours: null, createdAt: Date.now() - 86400000 * 5,
    },
    {
      uid, name: 'Kuis Pemrograman Berorientasi Objek',
      deadline: todayMinus(1), difficulty: 2, status: 'done',
      timePref: 'morning', hours: 1,
      description: '', checklist: [], prefSessionHours: null, createdAt: Date.now() - 86400000 * 3,
    },
    {
      uid, name: 'Laporan Kerja Praktek — Minggu 1',
      deadline: todayMinus(3), difficulty: 2, status: 'done',
      timePref: 'afternoon', hours: 2,
      description: '', checklist: [], prefSessionHours: null, createdAt: Date.now() - 86400000 * 7,
    },
  ];
}

export function getDemoSchedules(uid) {
  return [
    { uid, name: 'Kuliah Software Engineering',  day: 'Senin',  startTime: '08:00', endTime: '10:00', type: 'kelas',   difficulty: 3 },
    { uid, name: 'Kuliah Basis Data',             day: 'Senin',  startTime: '13:00', endTime: '15:00', type: 'kelas',   difficulty: 3 },
    { uid, name: 'Kuliah Jaringan Komputer',      day: 'Selasa', startTime: '09:00', endTime: '11:00', type: 'kelas',   difficulty: 3 },
    { uid, name: 'Praktikum Jaringan',            day: 'Selasa', startTime: '14:00', endTime: '17:00', type: 'kelas',   difficulty: 4 },
    { uid, name: 'Kuliah Kalkulus',               day: 'Rabu',   startTime: '07:30', endTime: '09:30', type: 'kelas',   difficulty: 4 },
    { uid, name: 'Kuliah Machine Learning',       day: 'Rabu',   startTime: '13:00', endTime: '15:00', type: 'kelas',   difficulty: 3 },
    { uid, name: 'Bimbingan Skripsi',             day: 'Kamis',  startTime: '10:00', endTime: '11:00', type: 'kelas',   difficulty: 2 },
    { uid, name: 'Kuliah Sistem Terdistribusi',   day: 'Kamis',  startTime: '13:00', endTime: '15:00', type: 'kelas',   difficulty: 3 },
    { uid, name: 'Kuliah Web Programming',        day: 'Jumat',  startTime: '08:00', endTime: '10:00', type: 'kelas',   difficulty: 2 },
    { uid, name: 'Kerja Paruh Waktu',             day: 'Sabtu',  startTime: '09:00', endTime: '13:00', type: 'kerja',   difficulty: 3 },
    { uid, name: 'Olahraga & Istirahat',          day: 'Minggu', startTime: '07:00', endTime: '09:00', type: 'pribadi', difficulty: 2 },
  ];
}

export function getDemoEnergy() {
  return { pref: 'morning', morning: 5, afternoon: 3, evening: 2, night: 1 };
}

export async function seedDemoData(uid) {
  if (!uid) throw new Error('UID required');

  const batch = writeBatch(db);
  const collections = ['tasks', 'schedules', 'sessions'];
  for (const col of collections) {
    const snap = await getDocs(query(collection(db, col), where('uid', '==', uid)));
    snap.docs.forEach(d => batch.delete(d.ref));
  }
  await batch.commit();

  for (const task of getDemoTasks(uid)) {
    await addDoc(collection(db, 'tasks'), task);
  }
  for (const sched of getDemoSchedules(uid)) {
    await addDoc(collection(db, 'schedules'), sched);
  }

  await setDoc(doc(db, 'energy', uid), getDemoEnergy(), { merge: true });
  await setDoc(doc(db, 'schedulingPrefs', uid), { overduePriority: 'unset', infeasiblePopupSeen: false }, { merge: true });

  console.log('✅ Demo data seeded successfully!');
  return true;
}
