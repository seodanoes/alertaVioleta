// src/main.js
import './css/main.css';
import { iniciarRouter } from './router/router.js';
import { authService } from './servicios/authService.js';

document.addEventListener('DOMContentLoaded', async () => {
  try {
    await iniciarRouter();
    pintarZonaCuenta();
    authService.onCambioSesion(() => pintarZonaCuenta());
  } catch (err) {
    console.error('[main] fallo al iniciar la app', err);
  }
});

function pintarZonaCuenta() {
  const host = document.getElementById('zonaCuenta');
  if (!host) return;
  const sesion = authService.sesionActualSync();
  if (!sesion) {
    host.innerHTML = `
      <a href="/login" data-link>Iniciar sesión</a>
      <a href="/registro" class="btn-borde" data-link>Crear cuenta</a>
    `;
    return;
  }
  host.innerHTML = `
    <a href="/mi-cuenta" class="nombre" data-link>
      <i class="fa-solid fa-user"></i>
      ${sesion.usuario.codigo || sesion.usuario.correo}
    </a>
    <button class="enlace" id="btnSalir" type="button">Salir</button>
  `;
  document.getElementById('btnSalir')?.addEventListener('click', async () => {
    await authService.cerrarSesion();
    pintarZonaCuenta();
  });
}