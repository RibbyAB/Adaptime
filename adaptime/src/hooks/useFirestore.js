import { useState, useEffect } from 'react';
import {
  collection, onSnapshot, addDoc, updateDoc,
  deleteDoc, doc, setDoc, getDoc, query, where, writeBatch
} from 'firebase/firestore';
import { db } from '../firebase';

// ─── Tasks ────────────────────────────────────────────────────────────────────
export function useTasks(uid) {
  const [tasks, setTasks]     = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) return;
    const q = query(collection(db, 'tasks'), where('uid', '==', uid));
    return onSnapshot(q, snap => {
      setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
  }, [uid]);

  const addTask = async (task) => {
    await addDoc(collection(db, 'tasks'), {
      ...task,
      uid,
      createdAt:   Date.now(),
      description: task.description  || '',
      checklist:   task.checklist    || [],   // [{ id, text, done }]
      prefSessionHours: task.prefSessionHours || null,
    });
  };

  const updateTask = async (id, updates) => {
    await updateDoc(doc(db, 'tasks', id), updates);
  };

  const deleteTask = async (id) => {
    // Also delete all sessions for this task
    const q   = query(collection(db, 'sessions'), where('taskId', '==', id));
    const snap = await new Promise(res => {
      const unsub = onSnapshot(q, s => { unsub(); res(s); });
    });
    const batch = writeBatch(db);
    snap.docs.forEach(d => batch.delete(d.ref));
    batch.delete(doc(db, 'tasks', id));
    await batch.commit();
  };

  return { tasks, loading, addTask, updateTask, deleteTask };
}

// ─── Sessions ─────────────────────────────────────────────────────────────────
export function useSessions(uid) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    if (!uid) return;
    const q = query(collection(db, 'sessions'), where('uid', '==', uid));
    return onSnapshot(q, snap => {
      setSessions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
  }, [uid]);

  // Replace all sessions for a uid (called after full reschedule)
  const replaceAllSessions = async (scheduledArray) => {
    const existing = await new Promise(res => {
      const q = query(collection(db, 'sessions'), where('uid', '==', uid));
      const unsub = onSnapshot(q, snap => { unsub(); res(snap); });
    });

    const batch = writeBatch(db);

    // Delete all existing
    existing.docs.forEach(d => batch.delete(d.ref));

    // Write new ones
    scheduledArray.forEach(s => {
      const ref = doc(collection(db, 'sessions'));
      batch.set(ref, { ...s, uid, isDone: false, note: '', checklist: [] });
    });

    await batch.commit();
  };

  const updateSession = async (id, updates) => {
    await updateDoc(doc(db, 'sessions', id), updates);
  };

  const deleteSession = async (id) => {
    await deleteDoc(doc(db, 'sessions', id));
  };

  return { sessions, loading, replaceAllSessions, updateSession, deleteSession };
}

// ─── Fixed Schedules ──────────────────────────────────────────────────────────
export function useSchedules(uid) {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    if (!uid) return;
    const q = query(collection(db, 'schedules'), where('uid', '==', uid));
    return onSnapshot(q, snap => {
      setSchedules(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
  }, [uid]);

  const addSchedule = async (schedule) => {
    await addDoc(collection(db, 'schedules'), {
      ...schedule,
      uid,
      difficulty: schedule.difficulty || 3,
    });
  };

  const updateSchedule = async (id, updates) => {
    await updateDoc(doc(db, 'schedules', id), updates);
  };

  const deleteSchedule = async (id) => {
    await deleteDoc(doc(db, 'schedules', id));
  };

  return { schedules, loading, addSchedule, updateSchedule, deleteSchedule };
}

// ─── Energy ───────────────────────────────────────────────────────────────────
export function useEnergy(uid) {
  const DEFAULT = { pref: 'morning', morning: 5, afternoon: 3, evening: 2, night: 1 };
  const [energy, setEnergyState] = useState(DEFAULT);
  const [loading, setLoading]    = useState(true);

  useEffect(() => {
    if (!uid) return;
    const ref = doc(db, 'energy', uid);
    return onSnapshot(ref, snap => {
      setEnergyState(snap.exists() ? snap.data() : DEFAULT);
      setLoading(false);
    });
  }, [uid]);

  const setEnergy = async (updates) => {
    await setDoc(doc(db, 'energy', uid), updates, { merge: true });
  };

  return { energy, loading, setEnergy };
}

// ─── Work Cap Settings ────────────────────────────────────────────────────────
export function useWorkCap(uid) {
  const DEFAULT_CAP = 8;
  const [workCap, setWorkCapState] = useState({ default: DEFAULT_CAP, overrides: {} });
  const [loading, setLoading]      = useState(true);

  useEffect(() => {
    if (!uid) return;
    const ref = doc(db, 'workCap', uid);
    return onSnapshot(ref, snap => {
      setWorkCapState(snap.exists() ? snap.data() : { default: DEFAULT_CAP, overrides: {} });
      setLoading(false);
    });
  }, [uid]);

  const setWorkCap = async (updates) => {
    await setDoc(doc(db, 'workCap', uid), updates, { merge: true });
  };

  // Build the per-date override map for the scheduler
  const getCapMap = () => {
    const map = {};
    if (workCap.overrides) {
      Object.entries(workCap.overrides).forEach(([date, cap]) => {
        map[date] = cap;
      });
    }
    return map;
  };

  return { workCap, loading, setWorkCap, getCapMap, defaultCap: workCap.default ?? DEFAULT_CAP };
}
