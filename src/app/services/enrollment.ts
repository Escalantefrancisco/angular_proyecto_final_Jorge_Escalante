
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import {
  Enrollment,
  EnrollmentStatus
} from '../models/enrollment.model';

import { StorageService } from './storage';
import { CatalogService } from './catalog';

@Injectable({
  providedIn: 'root'
})
export class EnrollmentService {

  private storage = inject(StorageService);
  private catalog = inject(CatalogService);

  // Consultar todas las inscripciones
  getAll(): Enrollment[] {
    return this.storage.getEnrollments();
  }

  // Buscar por identificador
  getById(id: string): Enrollment | undefined {
    return this.getAll().find(
      enrollment => enrollment.id === id
    );
  }

  // Inscripciones de un estudiante
  getByStudent(studentId: string): Enrollment[] {
    return this.getAll().filter(
      enrollment => enrollment.estudianteId === studentId
    );
  }

  // Filtrar por estudiante, período o estado
  filter(
    estudianteId = '',
    periodoId = '',
    estado = ''
  ): Enrollment[] {

    return this.getAll().filter(enrollment => {

      const estudianteValido =
        !estudianteId ||
        enrollment.estudianteId === estudianteId;

      const periodoValido =
        !periodoId ||
        enrollment.periodoId === periodoId;

      const estadoValido =
        !estado ||
        enrollment.estado === estado;

      return (
        estudianteValido &&
        periodoValido &&
        estadoValido
      );
    });
  }

  // Validar inscripción y sus relaciones
  async validate(enrollment: Enrollment): Promise<void> {

    if (
      typeof enrollment.id !== 'string' ||
      !/^INS-[A-Za-z0-9-]{1,20}$/.test(enrollment.id)
    ) {
      throw new Error(
        'El código de inscripción debe comenzar con INS-.'
      );
    }

    const data = this.storage.getData();

    const estudiante = data.estudiantes.find(
      student => student.id === enrollment.estudianteId
    );

    if (!estudiante) {
      throw new Error(
        'El estudiante seleccionado no existe.'
      );
    }

    const [cursos, periodos, estados] = await Promise.all([
      firstValueFrom(this.catalog.getCursos()),
      firstValueFrom(this.catalog.getPeriodos()),
      firstValueFrom(this.catalog.getEstados())
    ]);

    const periodo = periodos.find(
      item => item.id === enrollment.periodoId
    );

    if (!periodo) {
      throw new Error(
        'El período académico seleccionado no existe.'
      );
    }

    if (!Array.isArray(enrollment.cursoIds) ||
        enrollment.cursoIds.length === 0) {
      throw new Error(
        'Debes seleccionar al menos un curso.'
      );
    }

    if (
      enrollment.cursoIds.some(
        id => typeof id !== 'string'
      )
    ) {
      throw new Error(
        'Los identificadores de cursos no son válidos.'
      );
    }

    const idsUnicos = new Set(enrollment.cursoIds);

    if (idsUnicos.size !== enrollment.cursoIds.length) {
      throw new Error(
        'No puedes seleccionar el mismo curso dos veces.'
      );
    }

    for (const cursoId of enrollment.cursoIds) {

      const curso = cursos.find(
        item => item.id === cursoId
      );

      if (!curso) {
        throw new Error(
          `El curso ${cursoId} no existe.`
        );
      }

      if (curso.carreraId !== estudiante.carreraId) {
        throw new Error(
          `El curso ${curso.nombre} no pertenece a la carrera del estudiante.`
        );
      }
    }

    const estadoValido = estados.some(
      item => item.id === enrollment.estado
    );

    if (!estadoValido) {
      throw new Error(
        'El estado de inscripción no es válido.'
      );
    }

    if (
      typeof enrollment.observaciones !== 'string' ||
      enrollment.observaciones.length > 500
    ) {
      throw new Error(
        'Las observaciones no pueden superar 500 caracteres.'
      );
    }

    if (
      typeof enrollment.fechaInscripcion !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(enrollment.fechaInscripcion)
    ) {
      throw new Error(
        'La fecha de inscripción no es válida.'
      );
    }

    const fecha = new Date(
      enrollment.fechaInscripcion + 'T00:00:00'
    );

    if (
      Number.isNaN(fecha.getTime()) ||
      fecha.getFullYear() !== Number(enrollment.fechaInscripcion.slice(0, 4)) ||
      fecha.getMonth() + 1 !== Number(enrollment.fechaInscripcion.slice(5, 7)) ||
      fecha.getDate() !== Number(enrollment.fechaInscripcion.slice(8, 10))
    ) {
      throw new Error(
        'La fecha de inscripción no es válida.'
      );
    }

    // Una inscripción por estudiante y período
    const duplicada = data.inscripciones.some(
      item =>
        item.id !== enrollment.id &&
        item.estudianteId === enrollment.estudianteId &&
        item.periodoId === enrollment.periodoId &&
        item.estado !== 'Cancelada'
    );

    if (
      duplicada &&
      enrollment.estado !== 'Cancelada'
    ) {
      throw new Error(
        'El estudiante ya tiene una inscripción activa para ese período.'
      );
    }
  }

  // Registrar inscripción
  async create(enrollment: Enrollment): Promise<void> {

    if (this.getById(enrollment.id)) {
      throw new Error(
        'Ya existe una inscripción con ese código.'
      );
    }

    await this.validate(enrollment);

    const inscripciones = this.getAll();

    inscripciones.push(enrollment);

    this.storage.saveEnrollments(inscripciones);
  }

  // Editar inscripción
  async update(
    id: string,
    enrollment: Enrollment
  ): Promise<void> {

    if (id !== enrollment.id) {
      throw new Error(
        'No se permite modificar el código de inscripción.'
      );
    }

    const inscripciones = this.getAll();

    const index = inscripciones.findIndex(
      item => item.id === id
    );

    if (index === -1) {
      throw new Error(
        'Inscripción no encontrada.'
      );
    }

    if (inscripciones[index].estado === 'Cancelada') {
      throw new Error(
        'No se puede editar una inscripción cancelada.'
      );
    }

    await this.validate(enrollment);

    inscripciones[index] = enrollment;

    this.storage.saveEnrollments(inscripciones);
  }

  // Cancelar inscripción
  cancel(id: string): void {

    const inscripciones = this.getAll();

    const index = inscripciones.findIndex(
      item => item.id === id
    );

    if (index === -1) {
      throw new Error(
        'Inscripción no encontrada.'
      );
    }

    if (inscripciones[index].estado === 'Cancelada') {
      throw new Error(
        'La inscripción ya está cancelada.'
      );
    }

    inscripciones[index] = {
      ...inscripciones[index],
      estado: 'Cancelada' as EnrollmentStatus
    };

    this.storage.saveEnrollments(inscripciones);
  }

  // Contar inscripciones
  count(): number {
    return this.getAll().length;
  }
}
