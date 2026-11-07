
import { Injectable, inject } from '@angular/core';

import { Student } from '../models/student.model';
import { StorageService } from './storage';

@Injectable({
  providedIn: 'root'
})
export class StudentService {

  private storage = inject(StorageService);

  // Obtener todos los estudiantes
  getAll(): Student[] {
    return this.storage.getStudents();
  }

  // Buscar un estudiante por código
  getById(id: string): Student | undefined {
    return this.getAll().find(
      student => student.id === id
    );
  }

  // Buscar estudiantes por texto
  search(text: string): Student[] {
    const query = text.trim().toLowerCase();

    return this.getAll().filter(student => {
      const contenido = [
        student.id,
        student.nombres,
        student.apellidos,
        student.correo,
        student.carreraId
      ].join(' ').toLowerCase();

      return contenido.includes(query);
    });
  }

  // Verificar código duplicado
  exists(id: string): boolean {
    return this.getById(id) !== undefined;
  }

  // Validar los datos de un estudiante
  validate(student: Student): void {

    if (!/^EST-[A-Za-z0-9-]{1,20}$/.test(student.id)) {
      throw new Error(
        'El código debe comenzar con EST-.'
      );
    }

    if (
      !student.nombres?.trim() ||
      student.nombres.trim().length < 2 ||
      student.nombres.trim().length > 80
    ) {
      throw new Error(
        'Los nombres deben tener entre 2 y 80 caracteres.'
      );
    }

    if (
      !student.apellidos?.trim() ||
      student.apellidos.trim().length < 2 ||
      student.apellidos.trim().length > 80
    ) {
      throw new Error(
        'Los apellidos deben tener entre 2 y 80 caracteres.'
      );
    }

    const correo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (
      typeof student.correo !== 'string' ||
      student.correo.length > 254 ||
      !correo.test(student.correo)
    ) {
      throw new Error(
        'Ingresa un correo electrónico válido.'
      );
    }

    if (
      typeof student.direccion !== 'string' ||
      student.direccion.trim().length < 5 ||
      student.direccion.trim().length > 200
    ) {
      throw new Error(
        'La dirección debe tener entre 5 y 200 caracteres.'
      );
    }

    if (
      !student.genero?.trim() ||
      !student.carreraId?.trim() ||
      !student.jornada?.trim() ||
      !student.modalidad?.trim()
    ) {
      throw new Error(
        'Completa los datos académicos y personales.'
      );
    }

    // Validación de fecha de nacimiento
    const fecha = student.fechaNacimiento;

    if (
      typeof fecha !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(fecha)
    ) {
      throw new Error(
        'La fecha de nacimiento no es válida.'
      );
    }

    const nacimiento = new Date(fecha + 'T00:00:00');
    const hoy = new Date();

    if (
      Number.isNaN(nacimiento.getTime()) ||
      nacimiento.getFullYear() !== Number(fecha.slice(0, 4)) ||
      nacimiento.getMonth() + 1 !== Number(fecha.slice(5, 7)) ||
      nacimiento.getDate() !== Number(fecha.slice(8, 10)) ||
      nacimiento > hoy
    ) {
      throw new Error(
        'La fecha de nacimiento no puede ser inválida o futura.'
      );
    }

    // Validar arreglo de contactos
    if (
      !Array.isArray(student.contactos) ||
      student.contactos.length === 0
    ) {
      throw new Error(
        'Debes registrar al menos un número de contacto.'
      );
    }

    const tipos = ['Movil', 'Casa', 'Trabajo', 'Otro'];

    for (const contacto of student.contactos) {

      if (
        typeof contacto.numero !== 'string' ||
        !/^\+?[0-9]{8,15}$/.test(contacto.numero)
      ) {
        throw new Error(
          'Cada teléfono debe tener entre 8 y 15 dígitos.'
        );
      }

      if (!tipos.includes(contacto.tipo)) {
        throw new Error(
          'El tipo de contacto no es válido.'
        );
      }

      if (typeof contacto.activo !== 'boolean') {
        throw new Error(
          'El estado del contacto debe ser verdadero o falso.'
        );
      }
    }
  }

  // Registrar estudiante
  create(student: Student): void {
    this.validate(student);

    if (this.exists(student.id)) {
      throw new Error(
        'Ya existe un estudiante con ese código.'
      );
    }

    const estudiantes = this.getAll();

    estudiantes.push({
      ...student,
      fechaRegistro: new Date().toISOString()
    });

    this.storage.saveStudents(estudiantes);
  }

  // Modificar estudiante
  update(id: string, student: Student): void {

    if (id !== student.id) {
      throw new Error(
        'No se permite modificar el código estudiantil.'
      );
    }

    this.validate(student);

    const estudiantes = this.getAll();

    const index = estudiantes.findIndex(
      item => item.id === id
    );

    if (index === -1) {
      throw new Error('Estudiante no encontrado.');
    }

    estudiantes[index] = {
      ...student,
      fechaRegistro: estudiantes[index].fechaRegistro
    };

    this.storage.saveStudents(estudiantes);
  }

  // Eliminar estudiante
  delete(id: string): void {
    const data = this.storage.getData();

    const existe = data.estudiantes.some(
      student => student.id === id
    );

    if (!existe) {
      throw new Error('Estudiante no encontrado.');
    }

    const tieneInscripciones = data.inscripciones.some(
      enrollment => enrollment.estudianteId === id
    );

    if (tieneInscripciones) {
      throw new Error(
        'No puedes eliminar este estudiante porque tiene inscripciones asociadas.'
      );
    }

    this.storage.saveData({
      ...data,
      estudiantes: data.estudiantes.filter(
        student => student.id !== id
      )
    });
  }

  // Contar estudiantes
  count(): number {
    return this.getAll().length;
  }
}
