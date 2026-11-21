// src/modulos/inicioCtrl.js
import { authService } from '../servicios/authService.js';

export async function montar({ main }) {
  const sesion = authService.sesionActualSync();

  // Si hay sesión, personalizamos la sección "¿Ya tienes una cuenta?"
  const bloqueCuenta = main.querySelector('.bloque-seguro > div:last-child');
  if (bloqueCuenta && sesion) {
    bloqueCuenta.innerHTML = `
      <h3>Hola, ${sesion.usuario.codigo || sesion.usuario.correo}</h3>
      <p>Tu panel está listo. Desde ahí puedes retomar tu plan de seguridad y ver tus sesiones activas.</p>
      <p class="acciones">
        <a href="/panel-${sesion.rol}" class="btn btn-claro" data-link>Ir a mi panel</a>
        <a href="/mi-cuenta" class="btn btn-claro" data-link>Mi cuenta</a>
      </p>
    `;
  }
}