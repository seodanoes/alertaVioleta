// src/repositorios/usuarioRepo.js
import {
  collection, doc, getDoc, getDocs,
  setDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js';
import { db } from '/config/firebaseConfig.js';
import { Usuario } from '../clases/Usuario.js';

const COL = 'usuarios';

export const usuarioRepo = {
  async obtenerPorId(uid) {
    const snap = await getDoc(doc(db, COL, uid));
    return Usuario.desdeFirestore(snap);
  },

  async obtenerPorCorreo(correo) {
    const q = query(
      collection(db, COL),
      where('correo', '==', String(correo).toLowerCase().trim()),
      limit(1)
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return Usuario.desdeFirestore(snap.docs[0]);
  },

  async listar() {
    const q = query(collection(db, COL), orderBy('fechaCreacion', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => Usuario.desdeFirestore(d));
  },

  async crear(uid, datos) {
    const usuario = new Usuario(datos);
    await setDoc(doc(db, COL, uid), {
      ...usuario.aFirestoreCreacion(),
      fechaCreacion: serverTimestamp(),
      ultimaActualizacion: serverTimestamp(),
      ultimoInicioSesion: null
    });
    return uid;
  },

  async actualizar(uid, cambios) {
    await updateDoc(doc(db, COL, uid), {
      ...cambios,
      ultimaActualizacion: serverTimestamp()
    });
  },

  async registrarInicioSesion(uid) {
    await updateDoc(doc(db, COL, uid), {
      ultimoInicioSesion: serverTimestamp()
    });
  },

  async eliminar(uid) {
    await deleteDoc(doc(db, COL, uid));
  }
};