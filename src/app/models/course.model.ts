
export interface Course {
  id: string;
  codigo: string;
  nombre: string;
  creditos: number;
  carreraId: string;
}

export interface Period {
  id: string;
  nombre: string;
  fechaInicio: string;
  fechaFin: string;
  activo: boolean;
}
