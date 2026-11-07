
import { Injectable } from '@angular/core';

import { Student } from '../models/student.model';
import { Enrollment } from '../models/enrollment.model';

export interface StoredData {
  estudiantes: Student[];
  inscripciones: Enrollment[];
}

@Injectable({
  providedIn: 'root'
})
export class StorageService {

  private readonly STORAGE_KEY = 'uniregistro_datos';

  private crearDatosVacios(): StoredData {
    return {
      estudiantes: [],
      inscripciones: []
    };
  }

  // Leer toda la información almacenada
  getData(): StoredData {
    const json = localStorage.getItem(this.STORAGE_KEY);

    if (json === null) {
      return this.crearDatosVacios();
    }

    try {
      const data: unknown = JSON.parse(json);

      if (
        typeof data !== 'object' ||
        data === null ||
        Array.isArray(data)
      ) {
        throw new Error('Estructura de datos inválida.');
      }

      const value = data as Record<string, unknown>;

      if (
        !Array.isArray(value['estudiantes']) ||
        !Array.isArray(value['inscripciones'])
      ) {
        throw new Error('Colecciones inválidas.');
      }

      return value as unknown as StoredData;

    } catch {
      throw new Error(
        'No se pudieron leer los datos guardados. ' +
        'El almacenamiento puede estar dañado.'
      );
    }
  }

  // Guardar ambas colecciones en una sola operación
  saveData(data: StoredData): void {
    if (
      !Array.isArray(data.estudiantes) ||
      !Array.isArray(data.inscripciones)
    ) {
      throw new Error('Datos inválidos para guardar.');
    }

    try {
      localStorage.setItem(
        this.STORAGE_KEY,
        JSON.stringify(data)
      );
    } catch {
      throw new Error(
        'No fue posible guardar la información en el navegador.'
      );
    }
  }

  // Consultar estudiantes
  getStudents(): Student[] {
    return this.getData().estudiantes;
  }

  // Consultar inscripciones
  getEnrollments(): Enrollment[] {
    return this.getData().inscripciones;
  }

  // Guardar estudiantes conservando las inscripciones
  saveStudents(estudiantes: Student[]): void {
    const data = this.getData();

    this.saveData({
      ...data,
      estudiantes
    });
  }

  // Guardar inscripciones conservando los estudiantes
  saveEnrollments(inscripciones: Enrollment[]): void {
    const data = this.getData();

    this.saveData({
      ...data,
      inscripciones
    });
  }

  // Reemplazar todas las colecciones
  replaceAll(data: StoredData): void {
    this.saveData(data);
  }

  // Eliminar los datos del proyecto
  clearAll(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }
}
