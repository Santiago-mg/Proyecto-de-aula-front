import { randomBytes } from 'node:crypto';

/**
 * Datos que viajan entre los pasos de UN escenario (el correo de la cuenta de
 * prueba, el nombre del celular creado…). Se reinicia antes de cada escenario
 * para que ninguno dependa de lo que dejó el anterior.
 */
export const contexto = {
  correo: '',
  contrasena: 'Segura2026x',
  nombre: 'Ana Pérez',
  celular: '',
  reiniciar() {
    // Un correo distinto por escenario: el registro no admite repetidos.
    this.correo = `qa+${ Date.now() }${ randomBytes(3).toString('hex') }@gmail.com`; // dominio permitido por el backend
    this.contrasena = 'Segura2026x';
    this.nombre = 'Ana Pérez';
    this.celular = '';
  },
};
