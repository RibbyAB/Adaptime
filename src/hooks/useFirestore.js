import { useState, useEffect } from 'react';
import {
  collection, onSnapshot, addDoc, updateDoc,
  deleteDoc, doc, setDoc, query, where, writeBatch, getDocs
} from 'firebase/firestore';
import { db } from '../firebase';

// ─── Tasks ──
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
  const now = Date.now();

  await addDoc(collection(db, 'tasks'), {
    ...task,
    uid,
    createdAt: now,
    assignedAt: now, // timestamp saat task dibuat
    description: task.description || '',
    checklist: task.checklist || [],
    prefSessionHours: task.prefSessionHours || null,
  });
};

  const updateTask = async (id, updates) => {
    await updateDoc(doc(db, 'tasks', id), updates);
  };

  const deleteTask = async (id) => {
    const q   = query(collection(db, 'sessions'), where('taskId', '==', id));
    const snap = await getDocs(q);
    const batch = writeBatch(db);
    snap.docs.forEach(d => batch.delete(d.ref));
    batch.delete(doc(db, 'tasks', id));
    await batch.commit();
  };

  return { tasks, loading, addTask, updateTask, deleteTask };
}

// ─── Sessions ──
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

  const replaceAllSessions = async (scheduledArray) => {
    const q = query(collection(db, 'sessions'), where('uid', '==', uid));
    const existing = await getDocs(q);

    const batch = writeBatch(db);

    existing.docs.forEach(d => batch.delete(d.ref));

    scheduledArray.forEach(s => {
      const ref = doc(collection(db, 'sessions'));
      batch.set(ref, { ...s, uid, isDone: s.isDone ?? false, note: s.note || '', checklist: s.checklist || [] });
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

// ─── Fixed Schedules ──
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

// ─── Energy ──
export function useEnergy(uid) {
  const DEFAULT = { pref: 'morning', morning: 5, afternoon: 3, evening: 2, night: 1 };
  const [energy, setEnergyState] = useState(DEFAULT);
  const [loading, setLoading]    = useState(true);

  useEffect(() => {
    if (!uid) return;
    const ref = doc(db, 'energy', uid);
    return onSnapshot(ref, snap => {
      // BUG FIX: Always merge with DEFAULT to ensure all keys are present
      setEnergyState(snap.exists() ? { ...DEFAULT, ...snap.data() } : DEFAULT);
      setLoading(false);
    });
  }, [uid]);

  const setEnergy = async (updates) => {
    await setDoc(doc(db, 'energy', uid), updates, { merge: true });
  };

  return { energy, loading, setEnergy };
}

// ─── Work Cap Settings ──
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

  const getCapMap = () => {
    const map = {};
    if (workCap?.overrides) {
      Object.entries(workCap.overrides).forEach(([date, cap]) => {
        map[date] = cap;
      });
    }
    return map;
  };

  return { workCap, loading, setWorkCap, getCapMap, defaultCap: workCap?.default ?? DEFAULT_CAP };
}
