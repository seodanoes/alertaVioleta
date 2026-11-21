// src/modulos/registroCtrl.js
import { authService } from '../servicios/authService.js';
import { navegar } from '../router/router.js';

const $ = (id) => document.getElementById(id);

function limpiarErrores(form) {
  form.querySelectorAll('.campo.con-error').forEach((c) => c.classList.remove('con-error'));
  form.querySelectorAll('[aria-invalid]').forEach((i) => i.removeAttribute('aria-invalid'));
  const previa = form.querySelector(':scope > .form-alerta');
  if (previa) previa.remove();
}

function pintarErrores(form, errores) {
  if (!errores) return;
  Object.entries(errores).forEach(([campoId, mensaje]) => {
    const input = form.querySelector('#' + campoId) || form.querySelector(`[name="${campoId}"]`);
    if (!input) return;
    const cont = input.closest('.campo');
    if (cont) {
      cont.classList.add('con-error');
      const msg = cont.querySelector('.mensaje-error-campo');
      if (msg) msg.textContent = mensaje;
    }
    input.setAttribute('aria-invalid', 'true');
  });
}

function mostrarAlerta(form, tipo, texto) {
  const previa = form.querySelector(':scope > .form-alerta');
  if (previa) previa.remove();
  const div = document.createElement('div');
  div.className = 'form-alerta ' + tipo;
  div.setAttribute('role', tipo === 'error' ? 'alert' : 'status');
  div.textContent = texto;
  form.prepend(div);
}

function bloquear(form, texto) {
  const btn = form.querySelector('button[type="submit"]');
  const original = btn.textContent;
  btn.disabled = true;
  btn.textContent = texto;
  return () => { btn.disabled = false; btn.textContent = original; };
}

export function initRegistroCtrl() {
  const form = $('formRegistro');
  if (!form) return;

  if (form.dataset.ctrlListo === '1') return;
  form.dataset.ctrlListo = '1';

  // Verificar que TODOS los inputs existen
  const requeridos = ['nombre', 'correo', 'password', 'confirmarPassword'];
  const faltantes = requeridos.filter((id) => !form.querySelector('#' + id));
  if (faltantes.length) {
    console.error('[registroCtrl] faltan inputs con id:', faltantes);
    mostrarAlerta(form, 'error', 'Error de configuración del formulario. Faltan campos: ' + faltantes.join(', '));
    return;
  }

  form.querySelectorAll('input').forEach((input) => {
    input.addEventListener('input', () => {
      const cont = input.closest('.campo');
      if (cont?.classList.contains('con-error')) {
        cont.classList.remove('con-error');
        input.removeAttribute('aria-invalid');
      }
    });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    limpiarErrores(form);

    const datos = {
      nombre:            $('nombre').value,
      correo:            $('correo').value,
      password:          $('password').value,
      confirmarPassword: $('confirmarPassword').value
    };

    // Consentimiento (si existe en la vista)
    const consent = form.querySelector('[data-consentimiento]');
    if (consent && !consent.checked) {
      mostrarAlerta(form, 'error', 'Debes aceptar el aviso de confidencialidad para continuar.');
      const cont = consent.closest('.campo');
      if (cont) {
        cont.classList.add('con-error');
        const msg = cont.querySelector('.mensaje-error-campo');
        if (msg) msg.textContent = 'Debes aceptar este punto para continuar.';
      }
      return;
    }

    const desbloquear = bloquear(form, 'Creando cuenta…');
    try {
      const r = await authService.registrar(datos);

      if (r.ok) {
        // Esperar a que la sesión esté disponible antes de navegar
        const ses = await authService.sesionActual();
        if (!ses) {
          mostrarAlerta(form, 'error', 'La cuenta se creó, pero no se pudo cargar la sesión. Inicia sesión manualmente.');
          navegar('/login');
          return;
        }
        mostrarAlerta(form, 'exito', 'Cuenta creada. Redirigiendo…');
        navegar('/panel-usuaria');
      } else {
        if (r.errores) pintarErrores(form, r.errores);
        mostrarAlerta(form, 'error', r.mensaje || 'No se pudo completar el registro.');
        const primero = form.querySelector('.campo.con-error input');
        if (primero) primero.focus();
      }
    } catch (err) {
      console.error('[registroCtrl] excepción:', err);
      mostrarAlerta(form, 'error', 'Ocurrió un error inesperado: ' + (err?.message || err));
    } finally {
      desbloquear();
    }
  });
}