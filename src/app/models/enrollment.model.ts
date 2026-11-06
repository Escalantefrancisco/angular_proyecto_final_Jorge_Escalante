
export type EnrollmentStatus =
  | 'Borrador'
  | 'Registrada'
  | 'En revision'
  | 'Aprobada'
  | 'Rechazada'
  | 'Cancelada';

export interface Enrollment {
  id: string;
  estudianteId: string;
  periodoId: string;
  cursoIds: string[];
  estado: EnrollmentStatus;
  fechaInscripcion: string;
  observaciones: string;
}
