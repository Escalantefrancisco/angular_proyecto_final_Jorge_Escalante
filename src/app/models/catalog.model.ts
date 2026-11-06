
export interface CatalogOption {
  id: string;
  nombre: string;
}

export interface BackupData {
  version: string;
  fechaExportacion: string;
  estudiantes: import('./student.model').Student[];
  inscripciones: import('./enrollment.model').Enrollment[];
}
