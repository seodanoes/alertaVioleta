// src/vistas/layout.js
import { cargarHTML, inyectar } from './cargarComponente.js';

let montado = false;

function crearHostFooter() {
  let host = document.getElementById('app-footer');
  if (host) return host;
  const main = document.getElementById('app');
  host = document.createElement('div');
  host.id = 'app-footer';
  main.insertAdjacentElement('afterend', host);
  return host;
}

export async function montarLayout() {
  if (montado) return;

  // header + nav
  const navHost = document.getElementById('navbar');
  if (navHost && !navHost.querySelector('.barra')) {
    const navHTML = await cargarHTML('/componentes/nav.html');
    inyectar('#navbar', navHTML);
  }

  // footer
  const footerHost = crearHostFooter();
  if (!footerHost.querySelector('.pie')) {
    const footHTML = await cargarHTML('/componentes/footer.html');
    footerHost.innerHTML = footHTML;
  }

  wireMenu();
  wireSalidaRapida();
  montado = true;
}

function wireMenu() {
  const btn = document.getElementById('btnMenu');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const abierto = document.body.classList.toggle('menu-abierto');
    btn.setAttribute('aria-expanded', String(abierto));
  });
}

function wireSalidaRapida() {
  document.querySelectorAll('[data-salida-rapida]').forEach((b) => {
    if (b.dataset.wired) return;
    b.dataset.wired = '1';
    b.addEventListener('click', () => {
      window.location.replace('https://www.google.com/search?q=clima');
    });
  });

  if (window.__avEscWired) return;
  window.__avEscWired = true;
  let taps = 0, timer = null;
  window.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    taps++;
    clearTimeout(timer);
    timer = setTimeout(() => (taps = 0), 1200);
    if (taps >= 3) window.location.replace('https://www.google.com/search?q=clima');
  });
}

export function marcarActivo(path) {
  document.querySelectorAll('a[data-link]').forEach((a) => {
    a.removeAttribute('aria-current');
    const href = a.getAttribute('href');
    if (href === path || (href === '/' && path === '/')) a.setAttribute('aria-current', 'page');
  });
}