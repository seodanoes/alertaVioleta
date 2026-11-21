// src/vistas/cargarComponente.js
export async function cargarHTML(url) {
  const res = await fetch(url, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`No se pudo cargar ${url} (${res.status})`);
  return res.text();
}

export function inyectar(selector, html) {
  const host = document.querySelector(selector);
  if (!host) return null;
  host.innerHTML = html;
  return host;
}