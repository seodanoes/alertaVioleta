// src/servicios/validacionService.js

/* ============ Reglas ============ */
export const REGLAS = {
  nombre: {
    test: (v) => /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]{2,60}$/.test(v),
    mensaje: 'Escribe solo letras y espacios (2 a 60 caracteres).'
  },
  correo: {
    test: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v),
    mensaje: 'Escribe un correo válido, por ejemplo nombre@dominio.com.'
  },
  telefono: {
    test: (v) => /^\d{10}$/.test(v),
    mensaje: 'El teléfono debe tener exactamente 10 dígitos, sin espacios.'
  },
  password: {
    test: (v) => /^(?=.*[A-Za-z])(?=.*\d).{8,30}$/.test(v),
    mensaje: 'Usa entre 8 y 30 caracteres, con al menos una letra y un número.'
  },
  requerido: {
    test: (v) => /^.+$/s.test(v),
    mensaje: 'Este campo es obligatorio.'
  },
  mensajeTexto: {
    test: (v) => /^.{10,600}$/s.test(v),
    mensaje: 'Escribe entre 10 y 600 caracteres.'
  },
  nombreRefugio: {
    test: (v) => /^.{3,80}$/.test(v),
    mensaje: 'Escribe un nombre de 3 a 80 caracteres.'
  },
  horario: {
    test: (v) => /^.{3,60}$/.test(v),
    mensaje: 'Escribe un horario de 3 a 60 caracteres, por ejemplo "24 h".'
  },
  descripcionCorta: {
    test: (v) => /^.{10,300}$/s.test(v),
    mensaje: 'Escribe entre 10 y 300 caracteres.'
  },
  notaInterna: {
    test: (v) => /^.{0,300}$/s.test(v),
    mensaje: 'La nota admite hasta 300 caracteres.'
  },
  rol: {
    test: (v) => ['usuaria', 'asesora', 'admin'].includes(v),
    mensaje: 'Selecciona un tipo de cuenta válido.'
  },
  estadoCuenta: {
    test: (v) => ['activo', 'inactivo'].includes(v),
    mensaje: 'Selecciona un estado válido.'
  }
};

/* ============ Validaciones específicas ============ */
export function validarRegistro({ nombre, correo, password, confirmarPassword }) {
  const errores = {};
  const nombreLimpio = String(nombre || '').trim();
  const correoLimpio = String(correo || '').trim().toLowerCase();

  if (!REGLAS.nombre.test(nombreLimpio))
    errores.nombre = REGLAS.nombre.mensaje;
  if (!REGLAS.correo.test(correoLimpio))
    errores.correo = REGLAS.correo.mensaje;
  if (!REGLAS.password.test(password || ''))
    errores.password = REGLAS.password.mensaje;
  if (password !== confirmarPassword)
    errores.confirmarPassword = 'Las contraseñas no coinciden.';

  if (Object.keys(errores).length) {
    return { ok: false, errores, mensaje: 'Revisa los datos del formulario.' };
  }
  return { ok: true };
}

export function validarLogin({ correo, password }) {
  const errores = {};
  if (!REGLAS.correo.test(String(correo || '').trim().toLowerCase()))
    errores.correo = REGLAS.correo.mensaje;
  if (!password) errores.password = 'Ingresa tu contraseña.';
  if (Object.keys(errores).length)
    return { ok: false, errores, mensaje: 'Revisa los datos del formulario.' };
  return { ok: true };
}

export function validarCambioPassword({ actual, nueva, confirmar }) {
  const errores = {};
  if (!actual) errores.actual = 'Ingresa tu contraseña actual.';
  if (!REGLAS.password.test(nueva || '')) errores.nueva = REGLAS.password.mensaje;
  if (nueva !== confirmar) errores.confirmar = 'Las contraseñas no coinciden.';
  if (actual && nueva && actual === nueva)
    errores.nueva = 'La contraseña nueva debe ser distinta a la actual.';
  if (Object.keys(errores).length)
    return { ok: false, errores, mensaje: 'Revisa los datos del formulario.' };
  return { ok: true };
}