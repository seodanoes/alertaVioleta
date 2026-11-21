// src/servicios/authService.js
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updatePassword,
  deleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential
} from 'https://www.gstatic.com/firebasejs/10.4.0/firebase-auth.js';
import { auth } from '/config/firebaseConfig.js';
import { usuarioRepo } from '../repositorios/usuarioRepo.js';
import { Usuario } from '../clases/Usuario.js';
import {
  validarRegistro,
  validarLogin,
  validarCambioPassword,
  REGLAS
} from './validacionService.js';

/* ===================== Estado de sesión en caché ===================== */
let _cache = null;
let _inicializado = false;
let _resolverInit;
const _esperaInit = new Promise((res) => (_resolverInit = res));
const _listeners = new Set();

function notificar() {
  _listeners.forEach((cb) => { try { cb(_cache); } catch (e) { console.error(e); } });
}

onAuthStateChanged(auth, async (fbUser) => {
  if (!fbUser) {
    _cache = null;
    _inicializado = true;
    _resolverInit?.();
    notificar();
    return;
  }
  try {
    let u = await usuarioRepo.obtenerPorId(fbUser.uid);
    if (!u) {
      u = new Usuario({
        id: fbUser.uid,
        nombre: fbUser.displayName || fbUser.email?.split('@')[0] || '',
        correo: fbUser.email,
        rol: 'usuaria',
        estado: 'activo'
      });
    }
    _cache = { usuario: u, rol: u.rol };
  } catch (err) {
    console.warn('[authService] no se pudo leer el perfil en onAuthStateChanged:', err?.code || err);
    // Fallback: construimos un perfil mínimo para no dejar _cache en null
    _cache = {
      usuario: new Usuario({
        id: fbUser.uid,
        nombre: fbUser.displayName || fbUser.email?.split('@')[0] || '',
        correo: fbUser.email,
        rol: 'usuaria',
        estado: 'activo'
      }),
      rol: 'usuaria'
    };
  } finally {
    _inicializado = true;
    _resolverInit?.();
    notificar();
  }
});

/* ===================== Servicio público ===================== */
export const authService = {
  async _ready() {
    if (_inicializado) return;
    await _esperaInit;
  },

  async sesionActual() {
    await this._ready();
    if (_cache && _cache.usuario.estaActivo()) return _cache;
    return null;
  },

  sesionActualSync() {
    if (_cache && _cache.usuario.estaActivo()) return _cache;
    return null;
  },

  onCambioSesion(cb) {
    _listeners.add(cb);
    cb(_cache);
    return () => _listeners.delete(cb);
  },

  /* ------------- REGISTRO ------------- */
  async registrar({ nombre, correo, password, confirmarPassword }) {
    const v = validarRegistro({ nombre, correo, password, confirmarPassword });
    if (!v.ok) return v;

    const correoLimpio = correo.trim().toLowerCase();

    // 1) ¿Ya existe el correo en Firestore? (no bloqueante si falla la lectura)
    try {
      const existente = await usuarioRepo.obtenerPorCorreo(correoLimpio);
      if (existente) return { ok: false, mensaje: 'Ese correo ya tiene una cuenta.' };
    } catch (err) {
      console.warn('[authService] no se pudo verificar correo existente:', err?.code || err);
    }

    // 2) Crear en Firebase Auth
    let cred;
    try {
      cred = await createUserWithEmailAndPassword(auth, correoLimpio, password);
    } catch (err) {
      return { ok: false, mensaje: traducirErrorFirebase(err) };
    }

    // 3) Crear doc en Firestore con el MISMO uid. Rol forzado a 'usuaria'.
    try {
      await usuarioRepo.crear(cred.user.uid, {
        nombre: nombre.trim(),
        correo: correoLimpio,
        rol: 'usuaria',
        estado: 'activo'
      });
    } catch (err) {
      console.error('[authService] fallo al crear doc en Firestore:', err?.code || err, err);
      try { await deleteUser(cred.user); } catch (_) {}
      return {
        ok: false,
        mensaje: 'No se pudo completar el registro (Firestore). Código: ' + (err?.code || 'desconocido')
      };
    }

    // 4) Hidratar el cache NOSOTROS MISMOS, sin esperar a onAuthStateChanged
    _cache = {
      usuario: new Usuario({
        id: cred.user.uid,
        nombre: nombre.trim(),
        correo: correoLimpio,
        rol: 'usuaria',
        estado: 'activo',
        fechaCreacion: new Date(),
        ultimaActualizacion: new Date(),
        ultimoInicioSesion: new Date()
      }),
      rol: 'usuaria'
    };
    _inicializado = true;
    _resolverInit?.();
    notificar();

    return { ok: true, usuario: cred.user, rol: 'usuaria' };
  },

  /* ------------- LOGIN ------------- */
  async iniciarSesion({ correo, password }) {
    const v = validarLogin({ correo, password });
    if (!v.ok) return v;

    let cred;
    try {
      cred = await signInWithEmailAndPassword(auth, correo.trim().toLowerCase(), password);
    } catch (err) {
      return { ok: false, mensaje: traducirErrorFirebase(err) };
    }

    await this._ready();
    const u = _cache?.usuario;
    if (!u) {
      await signOut(auth);
      return { ok: false, mensaje: 'No se encontró el perfil. Contacta a la administración.' };
    }
    if (!u.estaActivo()) {
      await signOut(auth);
      return { ok: false, mensaje: 'Tu cuenta está desactivada. Contacta a la administración.' };
    }

    try { await usuarioRepo.registrarInicioSesion(u.id); } catch (_) {}

    return { ok: true, usuario: u, rol: u.rol };
  },

  /* ------------- LOGOUT ------------- */
  async cerrarSesion() {
    await signOut(auth);
  },

  /* ------------- RECUPERACIÓN ------------- */
  async recuperarPassword(correo) {
    if (!REGLAS.correo.test(String(correo || '').trim().toLowerCase()))
      return { ok: false, mensaje: 'Correo inválido.' };
    try {
      await sendPasswordResetEmail(auth, correo.trim().toLowerCase());
    } catch (_) {}
    return { ok: true, mensaje: 'Si el correo está registrado, enviamos un enlace de recuperación.' };
  },

  /* ------------- CAMBIO DE CONTRASEÑA ------------- */
  async cambiarPassword({ actual, nueva, confirmar }) {
    const v = validarCambioPassword({ actual, nueva, confirmar });
    if (!v.ok) return v;
    if (!auth.currentUser) return { ok: false, mensaje: 'No hay sesión activa.' };

    try {
      const cred = EmailAuthProvider.credential(auth.currentUser.email, actual);
      await reauthenticateWithCredential(auth.currentUser, cred);
      await updatePassword(auth.currentUser, nueva);
      return { ok: true, mensaje: 'Contraseña actualizada.' };
    } catch (err) {
      return { ok: false, mensaje: traducirErrorFirebase(err) };
    }
  },

  /* ------------- ELIMINAR CUENTA ------------- */
  async eliminarMiCuenta(password) {
    if (!auth.currentUser) return { ok: false, mensaje: 'No hay sesión activa.' };
    try {
      const cred = EmailAuthProvider.credential(auth.currentUser.email, password);
      await reauthenticateWithCredential(auth.currentUser, cred);
      const uid = auth.currentUser.uid;
      await usuarioRepo.eliminar(uid);
      await deleteUser(auth.currentUser);
      return { ok: true };
    } catch (err) {
      return { ok: false, mensaje: traducirErrorFirebase(err) };
    }
  },

  /* ------------- GUARDIA POR ROLES ------------- */
  async exigir(roles) {
    const s = await this.sesionActual();
    if (!s || (roles && !roles.includes(s.rol))) throw new Error('No autorizada');
    return s;
  }
};

/* ===================== Traducción de errores Firebase ===================== */
function traducirErrorFirebase(err) {
  const code = err?.code || '';
  switch (code) {
    case 'auth/email-already-in-use': return 'Ese correo ya tiene una cuenta.';
    case 'auth/invalid-email':        return 'Correo inválido.';
    case 'auth/weak-password':        return 'La contraseña es demasiado débil.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':   return 'Correo o contraseña incorrectos.';
    case 'auth/too-many-requests':    return 'Demasiados intentos. Intenta más tarde.';
    case 'auth/requires-recent-login':return 'Por seguridad, vuelve a iniciar sesión antes de esta acción.';
    case 'permission-denied':         return 'Sin permisos en la base de datos. Revisa las reglas de Firestore.';
    default:                          return 'No se pudo completar la acción. Inténtalo de nuevo.';
  }
}