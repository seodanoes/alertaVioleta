// src/clases/Usuario.js
export class Usuario {
  constructor({
    id = null,
    nombre = '',
    correo = '',
    rol = 'usuaria',
    estado = 'activo',
    fechaCreacion = null,
    ultimaActualizacion = null,
    ultimoInicioSesion = null
  } = {}) {
    this.id = id;
    this.nombre = String(nombre || '').trim();
    this.correo = String(correo || '').toLowerCase().trim();
    this.rol = rol;
    this.estado = estado;
    this.fechaCreacion = fechaCreacion;
    this.ultimaActualizacion = ultimaActualizacion;
    this.ultimoInicioSesion = ultimoInicioSesion;
  }

  static desdeFirestore(docSnap) {
    if (!docSnap || !docSnap.exists()) return null;
    const d = docSnap.data();
    return new Usuario({
      id: docSnap.id,
      nombre: d.nombre,
      correo: d.correo,
      rol: d.rol,
      estado: d.estado,
      fechaCreacion: d.fechaCreacion?.toDate?.() ?? null,
      ultimaActualizacion: d.ultimaActualizacion?.toDate?.() ?? null,
      ultimoInicioSesion: d.ultimoInicioSesion?.toDate?.() ?? null
    });
  }

  aFirestoreCreacion() {
    return {
      nombre: this.nombre,
      correo: this.correo,
      rol: this.rol,
      estado: this.estado
    };
  }

  aFirestoreActualizacion() {
    return {
      nombre: this.nombre,
      correo: this.correo,
      rol: this.rol,
      estado: this.estado
    };
  }

  esAdmin()    { return this.rol === 'admin'; }
  esAsesora()  { return this.rol === 'asesora'; }
  esUsuaria()  { return this.rol === 'usuaria'; }
  estaActivo() { return this.estado === 'activo'; }
}