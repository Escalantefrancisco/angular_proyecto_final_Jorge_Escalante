
export interface Contact {
  numero: string;
  tipo: 'Movil' | 'Casa' | 'Trabajo' | 'Otro';
  activo: boolean;
}

export interface Student {
  id: string;
  nombres: string;
  apellidos: string;
  fechaNacimiento: string;
  genero: string;
  correo: string;
  direccion: string;
  carreraId: string;
  jornada: string;
  modalidad: string;
  contactos: Contact[];
  fechaRegistro: string;
}
