// src/router/rutas.js
import { initLoginCtrl } from "../modulos/loginCtrl.js";
import { initRegistroCtrl } from "../modulos/registroCtrl.js";

export const ROLES = {
  usuaria: { etiqueta: 'Usuaria',        panel: '/panel-usuaria' },
  asesora: { etiqueta: 'Asesora',        panel: '/panel-asesora' },
  admin:   { etiqueta: 'Administración', panel: '/panel-admin'   }
};

export const RUTAS = [
  // públicas
  { path: '/',                      vista: '/inicio.html',                        controlador: 'inicioCtrl.js' },
  { path: '/mapa-refugios',         vista: '/modulos/mapa-refugios.html',        controlador: null },
  { path: '/asesoria-legal',        vista: '/modulos/asesoria-legal.html',       controlador: null },
  { path: '/protocolos-crisis',     vista: '/modulos/protocolos-crisis.html',    controlador: null },
  { path: '/recursos-psicologicos', vista: '/modulos/recursos-psicologicos.html',controlador: null },
  { path: '/privacidad',            vista: '/modulos/privacidad.html',           controlador: null },
  { path: '/sobre-nosotros',        vista: '/modulos/sobre-nosotros.html',       controlador: null },
  { path: '/preguntas-frecuentes',  vista: '/modulos/preguntas-frecuentes.html', controlador: null },
  { path: '/buzon',                 vista: '/modulos/buzon.html',                controlador: null },
  { path: '/ayuda',                 vista: '/modulos/ayuda.html',                controlador: null },
  { path: '/contacto',              vista: '/modulos/contacto.html',             controlador: null },
  { path: '/mapa-sitio',            vista: '/modulos/mapa-sitio.html',           controlador: null },

  // invitada
  { path: '/login',                 vista: '/modulos/login.html',                controlador: initLoginCtrl,    invitada: true },
  { path: '/registro',              vista: '/modulos/registro.html',             controlador: initRegistroCtrl, invitada: true },
  { path: '/recuperar-password',    vista: '/modulos/recuperar-password.html',   controlador: null,             invitada: true },
  { path: '/restablecer-password',  vista: '/modulos/restablecer-password.html', controlador: null },

  // protegidas
  { path: '/mi-cuenta',             vista: '/modulos/mi-cuenta.html',            controlador: 'miCuentaCtrl.js',     roles: ['usuaria','asesora','admin'] },
  { path: '/panel-usuaria',         vista: '/modulos/panel-usuaria.html',        controlador: 'panelUsuariaCtrl.js', roles: ['usuaria'] },
  { path: '/panel-asesora',         vista: '/modulos/panel-asesora.html',        controlador: 'panelAsesoraCtrl.js', roles: ['asesora'] },
  { path: '/panel-admin',           vista: '/modulos/panel-admin.html',          controlador: 'panelAdminCtrl.js',   roles: ['admin'] },
  { path: '/bandeja-buzon',         vista: '/modulos/bandeja-buzon.html',        controlador: 'bandejaCtrl.js',      roles: ['asesora','admin'] },
  { path: '/admin-usuarios',        vista: '/modulos/admin-usuarios.html',       controlador: 'adminUsuariosCtrl.js',roles: ['admin'] },
  { path: '/admin-refugios',        vista: '/modulos/admin-refugios.html',       controlador: 'adminRefugiosCtrl.js',roles: ['admin'] },

  // acceso denegado
  { path: '/acceso-denegado',       vista: '/modulos/acceso-denegado.html',              controlador: null }
];

export function buscarRuta(path) {
  return RUTAS.find((r) => r.path === path) || null;
}