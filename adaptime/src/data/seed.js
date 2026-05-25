export const TODAY = "2026-05-25";

export const DAYS = ['Senin','Selasa','Rabu','Kamis','Jumat','Sabtu','Minggu'];

export const SEED_TASKS = [
  { id:1, name:'Tugas Pemrograman Web',           deadline:'2026-05-27', difficulty:4, status:'pending',     timePref:'morning',   hours:3 },
  { id:2, name:'Baca Materi Algoritma',            deadline:'2026-05-26', difficulty:2, status:'in-progress', timePref:'afternoon', hours:1 },
  { id:3, name:'Quiz Database',                    deadline:'2026-05-28', difficulty:3, status:'pending',     timePref:'morning',   hours:2 },
  { id:4, name:'Presentasi Kelompok ADAPTIME',     deadline:'2026-05-30', difficulty:5, status:'pending',     timePref:'morning',   hours:6 },
  { id:5, name:'Review Catatan Kalkulus',          deadline:'2026-05-24', difficulty:2, status:'done',        timePref:'evening',   hours:1 },
  { id:6, name:'Laporan Praktikum Jaringan',       deadline:'2026-05-29', difficulty:3, status:'done',        timePref:'afternoon', hours:2 },
  { id:7, name:'UAS Jaringan Komputer',            deadline:'2026-05-23', difficulty:5, status:'overdue',     timePref:'morning',   hours:4 },
];

export const SEED_SCHEDULES = [
  { id:1, day:'Senin',   startTime:'08:00', endTime:'10:00', type:'kelas',   name:'Pemrograman Web' },
  { id:2, day:'Senin',   startTime:'13:00', endTime:'15:00', type:'kelas',   name:'Algoritma & Pemrograman' },
  { id:3, day:'Selasa',  startTime:'09:00', endTime:'11:00', type:'kelas',   name:'Database' },
  { id:4, day:'Rabu',    startTime:'10:00', endTime:'12:00', type:'kerja',   name:'Part-time Job' },
  { id:5, day:'Kamis',   startTime:'08:00', endTime:'10:00', type:'kelas',   name:'Kalkulus Lanjut' },
  { id:6, day:'Jumat',   startTime:'14:00', endTime:'16:00', type:'pribadi', name:'Olahraga' },
];

export const DEFAULT_ENERGY = {
  pref: 'morning',
  morning: 5,
  afternoon: 3,
  evening: 2,
  night: 1,
};
