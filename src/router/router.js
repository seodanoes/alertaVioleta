// src/router/router.js
import { buscarRuta, ROLES } from './rutas.js';
import { cargarHTML } from '../vistas/cargarComponente.js';
import { montarLayout, marcarActivo } from '../vistas/layout.js';
import { authService } from '../servicios/authService.js';

const modulosCache = new Map();

/**
 * Resuelve el controlador a partir de lo que venga en `ruta.controlador`:
 *  - función  → se envuelve como { montar }
 *  - string   → import dinámico ../modulos/<nombre>
 *  - null     → sin controlador
 */
async function cargarControlador(controlador) {
  if (!controlador) return null;

  if (typeof controlador === 'function') {
    return { montar: controlador };
  }

  if (typeof controlador === 'string') {
    if (modulosCache.has(controlador)) return modulosCache.get(controlador);
    try {
      const mod = await import(/* @vite-ignore */ `../modulos/${controlador}`);
      modulosCache.set(controlador, mod);
      return mod;
    } catch (err) {
      console.error(`[router] no se pudo importar el controlador "${controlador}"`, err);
      return null;
    }
  }

  console.error('[router] tipo de controlador no soportado:', typeof controlador, controlador);
  return null;
}

async function ejecutarControlador(mod, ctx) {
  if (!mod) return;

  if (typeof mod.montar === 'function') {
    await mod.montar(ctx);
    return;
  }

  // Fallback: cualquier export que empiece con "init"
  const initExport = Object.keys(mod).find(
    (k) => k.startsWith('init') && typeof mod[k] === 'function'
  );
  if (initExport) {
    await mod[initExport](ctx);
    return;
  }

  console.warn('[router] el controlador no exporta "montar" ni un "init..."', mod);
}

async function pintarVista(ruta) {
  const main = document.getElementById('app');
  if (!main) return;

  if (!ruta.vista) {
    main.innerHTML = `<div class="contenedor seccion">
      <h1>En construcción</h1>
      <p>Esta sección se migrará al nuevo formato SPA próximamente.</p>
    </div>`;
    return;
  }

  main.innerHTML = '<div class="contenedor seccion"><p>Cargando…</p></div>';

  try {
    const html = await cargarHTML(ruta.vista);
    main.innerHTML = html;
    const mod = await cargarControlador(ruta.controlador);
    await ejecutarControlador(mod, { ruta, main });
  } catch (err) {
    console.error('[router] error al pintar vista', err);
    main.innerHTML = `<div class="contenedor seccion">
      <h1>No se pudo cargar la sección</h1>
      <p>${err.message}</p>
    </div>`;
  }
}

async function redirigirA(path) {
  if (window.location.pathname === path) return;
  window.history.replaceState({}, '', path);
  await navegar(path, true);
}

export async function navegar(path, reemplazar = false) {
  const ruta = buscarRuta(path);
  if (!ruta) return redirigirA('/');

  const sesion = await authService.sesionActual();

  if (ruta.invitada && sesion) return redirigirA(ROLES[sesion.rol].panel);
  if (ruta.roles && !sesion) return redirigirA(`/login?siguiente=${encodeURIComponent(path)}`);
  if (ruta.roles && sesion && !ruta.roles.includes(sesion.rol)) return redirigirA('/acceso-denegado');

  if (reemplazar) window.history.replaceState({}, '', path);
  else window.history.pushState({}, '', path);

  marcarActivo(path);
  await pintarVista(ruta);
  window.scrollTo({ top: 0 });
}

export async function iniciarRouter() {
  await montarLayout();

  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[data-link]');
    if (!a) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    navegar(a.getAttribute('href'));
  });

  window.addEventListener('popstate', () => navegar(window.location.pathname, true));

  await navegar(window.location.pathname, true);
}