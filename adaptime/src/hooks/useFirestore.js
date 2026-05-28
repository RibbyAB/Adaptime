import { useState, useEffect } from 'react';
import {
  collection, onSnapshot, addDoc, updateDoc,
  deleteDoc, doc, setDoc, query, where
} from 'firebase/firestore';
import { db } from '../firebase';

export function useTasks(uid) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) return;
    const q = query(collection(db, 'tasks'), where('uid', '==', uid));
    const unsub = onSnapshot(q, snap => {
      setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, [uid]);

  const addTask = async (task) => {
    await addDoc(collection(db, 'tasks'), { ...task, uid, createdAt: Date.now() });
  };

  const updateTask = async (id, updates) => {
    await updateDoc(doc(db, 'tasks', id), updates);
  };

  const deleteTask = async (id) => {
    await deleteDoc(doc(db, 'tasks', id));
  };

  return { tasks, loading, addTask, updateTask, deleteTask };
}

export function useSchedules(uid) {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) return;
    const q = query(collection(db, 'schedules'), where('uid', '==', uid));
    const unsub = onSnapshot(q, snap => {
      setSchedules(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, [uid]);

  const addSchedule = async (schedule) => {
    await addDoc(collection(db, 'schedules'), { ...schedule, uid });
  };

  const updateSchedule = async (id, updates) => {
    await updateDoc(doc(db, 'schedules', id), updates);
  };

  const deleteSchedule = async (id) => {
    await deleteDoc(doc(db, 'schedules', id));
  };

  return { schedules, loading, addSchedule, updateSchedule, deleteSchedule };
}

export function useEnergy(uid) {
  const DEFAULT = { pref: 'morning', morning: 5, afternoon: 3, evening: 2, night: 1 };
  const [energy, setEnergyState] = useState(DEFAULT);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) return;
    const ref = doc(db, 'energy', uid);
    const unsub = onSnapshot(ref, snap => {
      if (snap.exists()) setEnergyState(snap.data());
      else setEnergyState(DEFAULT);
      setLoading(false);
    });
    return unsub;
  }, [uid]);

  const setEnergy = async (updates) => {
    await setDoc(doc(db, 'energy', uid), updates, { merge: true });
  };

  return { energy, loading, setEnergy };
}
