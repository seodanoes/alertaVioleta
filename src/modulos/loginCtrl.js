// src/modulos/loginCtrl.js
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

export function initLoginCtrl() {
  const form = $('formLogin');
  if (!form) return;

  // Evita listeners duplicados si la vista se re-monta
  if (form.dataset.ctrlListo === '1') return;
  form.dataset.ctrlListo = '1';

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

    const correo = $('correoLogin')?.value ?? '';
    const password = $('passwordLogin')?.value ?? '';

    const btn = form.querySelector('button[type="submit"]');
    const original = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Entrando…';

    try {
      const r = await authService.iniciarSesion({ correo, password });
      if (r.ok) {
        const destino = r.rol === 'admin'   ? '/panel-admin'
                      : r.rol === 'asesora' ? '/panel-asesora'
                      :                       '/panel-usuaria';
        navegar(destino);
      } else {
        if (r.errores) pintarErrores(form, r.errores);
        mostrarAlerta(form, 'error', r.mensaje || 'Correo o contraseña incorrectos.');
        $('passwordLogin').value = '';
        $('passwordLogin').focus();
      }
    } catch (err) {
      console.error('[loginCtrl] excepción:', err);
      mostrarAlerta(form, 'error', 'Ocurrió un error inesperado.');
    } finally {
      btn.disabled = false;
      btn.textContent = original;
    }
  });
}