
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { Student, Contact } from '../models/student.model';

import { Enrollment } from '../models/enrollment.model';
import { BackupData } from '../models/catalog.model';

import {
  StorageService,
  StoredData
} from './storage';

import { StudentService } from './student';
import { CatalogService } from './catalog';

export interface BackupValidationResult {
  valido: boolean;
  errores: string[];
  respaldo: BackupData | null;
  totalEstudiantes: number;
  totalInscripciones: number;
}

@Injectable({
  providedIn: 'root'
})
export class BackupService {

  private storage = inject(StorageService);
  private studentService = inject(StudentService);
  private catalogService = inject(CatalogService);

  private readonly VERSION = '1.0';
  private readonly MAX_FILE_SIZE = 5 * 1024 * 1024;

  // Crear el contenido del respaldo
  crearRespaldo(): BackupData {

    const datos = this.storage.getData();

    return {
      version: this.VERSION,
      fechaExportacion: new Date().toISOString(),
      estudiantes: datos.estudiantes,
      inscripciones: datos.inscripciones
    };
  }

  // Descargar respaldo como JSON
  exportar(): void {

    const respaldo = this.crearRespaldo();

    const contenido = JSON.stringify(
      respaldo,
      null,
      2
    );

    const blob = new Blob(
      [contenido],
      { type: 'application/json;charset=utf-8' }
    );

    const url = URL.createObjectURL(blob);

    const fecha = new Date();
    const nombreFecha = [
      fecha.getFullYear(),
      String(fecha.getMonth() + 1).padStart(2, '0'),
      String(fecha.getDate()).padStart(2, '0')
    ].join('-');

    const enlace = document.createElement('a');

    enlace.href = url;
    enlace.download =
      `uniregistro-respaldo-${nombreFecha}.json`;

    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();

    // Liberar el recurso después de iniciar la descarga.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  // Leer y validar un archivo sin guardar nada
  async validarArchivo(
    archivo: File
  ): Promise<BackupValidationResult> {

    if (
      !archivo.name.toLowerCase().endsWith('.json')
    ) {
      return this.resultadoError(
        'Selecciona un archivo con extensión .json.'
      );
    }

    if (archivo.size > this.MAX_FILE_SIZE) {
      return this.resultadoError(
        'El archivo supera el límite de 5 MB.'
      );
    }

    if (archivo.size === 0) {
      return this.resultadoError(
        'El archivo está vacío.'
      );
    }

    try {
      const contenido = await archivo.text();
      const datos: unknown = JSON.parse(contenido);

      return await this.validarRespaldo(datos);

    } catch (error) {

      if (error instanceof SyntaxError) {
        return this.resultadoError(
          'El archivo no contiene un JSON válido.'
        );
      }

      return this.resultadoError(
        error instanceof Error
          ? error.message
          : 'No fue posible leer el archivo.'
      );
    }
  }

  private resultadoError(
    mensaje: string
  ): BackupValidationResult {

    return {
      valido: false,
      errores: [mensaje],
      respaldo: null,
      totalEstudiantes: 0,
      totalInscripciones: 0
    };
  }

  private esObjeto(
    valor: unknown
  ): valor is Record<string, unknown> {

    return (
      typeof valor === 'object' &&
      valor !== null &&
      !Array.isArray(valor)
    );
  }

  private esTexto(
    valor: unknown
  ): valor is string {
    return typeof valor === 'string';
  }

  private textoNoVacio(
    valor: unknown
  ): valor is string {

    return this.esTexto(valor) &&
      valor.trim().length > 0;
  }

  private fechaValida(valor: unknown): boolean {

    if (
      !this.esTexto(valor) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(valor)
    ) {
      return false;
    }

    const [anio, mes, dia] = valor.split('-').map(Number);

    const fecha = new Date(0);
    fecha.setFullYear(anio, mes - 1, dia);
    fecha.setHours(0, 0, 0, 0);

    return (
      fecha.getFullYear() === anio &&
      fecha.getMonth() === mes - 1 &&
      fecha.getDate() === dia
    );
  }

  private contactoValido(valor: unknown): boolean {

    if (!this.esObjeto(valor)) {
      return false;
    }

    const tipos: Contact['tipo'][] = [
      'Movil',
      'Casa',
      'Trabajo',
      'Otro'
    ];

    return (
      this.esTexto(valor['numero']) &&
      /^\+?[0-9]{8,15}$/.test(valor['numero']) &&
      tipos.some(tipo => tipo === valor['tipo']) &&
      typeof valor['activo'] === 'boolean'
    );
  }

  // Validar todos los datos del respaldo
  async validarRespaldo(
    datos: unknown
  ): Promise<BackupValidationResult> {

    const errores: string[] = [];

    if (!this.esObjeto(datos)) {
      return this.resultadoError(
        'El respaldo debe ser un objeto JSON.'
      );
    }

    if (datos['version'] !== this.VERSION) {
      errores.push(
        `Versión no compatible. Se requiere ${this.VERSION}.`
      );
    }

    if (
      !this.esTexto(datos['fechaExportacion']) ||
      !Number.isFinite(
        Date.parse(datos['fechaExportacion'])
      )
    ) {
      errores.push(
        'La fecha de exportación no es válida.'
      );
    }

    if (!Array.isArray(datos['estudiantes'])) {
      errores.push(
        'La propiedad estudiantes debe ser un arreglo.'
      );
    }

    if (!Array.isArray(datos['inscripciones'])) {
      errores.push(
        'La propiedad inscripciones debe ser un arreglo.'
      );
    }

    if (errores.length > 0) {
      return {
        valido: false,
        errores,
        respaldo: null,
        totalEstudiantes: 0,
        totalInscripciones: 0
      };
    }

    const estudiantesRaw =
      datos['estudiantes'] as unknown[];

    const inscripcionesRaw =
      datos['inscripciones'] as unknown[];

    const [
      cursos,
      periodos,
      estados,
      generos,
      jornadas,
      modalidades
    ] = await Promise.all([
      firstValueFrom(this.catalogService.getCursos()),
      firstValueFrom(this.catalogService.getPeriodos()),
      firstValueFrom(this.catalogService.getEstados()),
      firstValueFrom(this.catalogService.getGeneros()),
      firstValueFrom(this.catalogService.getJornadas()),
      firstValueFrom(this.catalogService.getModalidades())
    ]);

    const carreras = new Set(
      cursos.map(curso => curso.carreraId)
    );

    const idsEstudiantes = new Set<string>();
    const idsInscripciones = new Set<string>();
    const inscripcionesPorPeriodo = new Set<string>();

    // Validar estudiantes
    estudiantesRaw.forEach((valor, index) => {

      const prefijo = `Estudiante ${index + 1}`;

      if (!this.esObjeto(valor)) {
        errores.push(`${prefijo}: estructura incorrecta.`);
        return;
      }

      const id = valor['id'];

      if (
        !this.esTexto(id) ||
        !/^EST-[A-Za-z0-9-]{1,20}$/.test(id)
      ) {
        errores.push(`${prefijo}: código inválido.`);
      } else if (idsEstudiantes.has(id)) {
        errores.push(`${prefijo}: código duplicado ${id}.`);
      } else {
        idsEstudiantes.add(id);
      }

      const campos = [
        'nombres',
        'apellidos',
        'genero',
        'correo',
        'direccion',
        'carreraId',
        'jornada',
        'modalidad'
      ];

      for (const campo of campos) {
        if (!this.textoNoVacio(valor[campo])) {
          errores.push(
            `${prefijo}: el campo ${campo} es obligatorio.`
          );
        }
      }

      if (
        !this.fechaValida(valor['fechaNacimiento'])
      ) {
        errores.push(
          `${prefijo}: fecha de nacimiento inválida.`
        );
      }

      if (
        !this.esTexto(valor['fechaRegistro']) ||
        !Number.isFinite(
          Date.parse(valor['fechaRegistro'])
        )
      ) {
        errores.push(
          `${prefijo}: fecha de registro inválida.`
        );
      }

      if (
        !Array.isArray(valor['contactos']) ||
        valor['contactos'].length === 0
      ) {
        errores.push(
          `${prefijo}: debe tener al menos un contacto.`
        );
      } else {

        valor['contactos'].forEach(
          (contacto: unknown, indice: number) => {

            if (!this.contactoValido(contacto)) {
              errores.push(
                `${prefijo}: contacto ${indice + 1} inválido.`
              );
            }
          }
        );
      }

      if (
        this.textoNoVacio(valor['genero']) &&
        !generos.some(
          opcion => opcion.id === valor['genero']
        )
      ) {
        errores.push(`${prefijo}: género no válido.`);
      }

      if (
        this.textoNoVacio(valor['jornada']) &&
        !jornadas.some(
          opcion => opcion.id === valor['jornada']
        )
      ) {
        errores.push(`${prefijo}: jornada no válida.`);
      }

      if (
        this.textoNoVacio(valor['modalidad']) &&
        !modalidades.some(
          opcion => opcion.id === valor['modalidad']
        )
      ) {
        errores.push(`${prefijo}: modalidad no válida.`);
      }

      if (
        this.textoNoVacio(valor['carreraId']) &&
        !carreras.has(valor['carreraId'])
      ) {
        errores.push(`${prefijo}: carrera inexistente.`);
      }

      
// Reutilizar las reglas del servicio únicamente
// si la estructura básica permite evaluarlas.
const estructuraSegura =
  this.esTexto(valor['id']) &&
  this.esTexto(valor['nombres']) &&
  this.esTexto(valor['apellidos']) &&
  this.esTexto(valor['correo']) &&
  this.esTexto(valor['direccion']) &&
  this.esTexto(valor['genero']) &&
  this.esTexto(valor['carreraId']) &&
  this.esTexto(valor['jornada']) &&
  this.esTexto(valor['modalidad']) &&
  this.esTexto(valor['fechaNacimiento']) &&
  Array.isArray(valor['contactos']) &&
  valor['contactos'].every(
    contacto => this.contactoValido(contacto)
  );

if (estructuraSegura) {
  try {
    this.studentService.validate(
      valor as unknown as Student
    );
  } catch (error) {
    errores.push(
      `${prefijo}: ${
        error instanceof Error
          ? error.message
          : 'datos personales inválidos.'
      }`
    );
  }
}

    });

    // Validar inscripciones
    inscripcionesRaw.forEach((valor, index) => {

      const prefijo = `Inscripción ${index + 1}`;

      if (!this.esObjeto(valor)) {
        errores.push(`${prefijo}: estructura incorrecta.`);
        return;
      }

      const id = valor['id'];

      if (
        !this.esTexto(id) ||
        !/^INS-[A-Za-z0-9-]{1,20}$/.test(id)
      ) {
        errores.push(`${prefijo}: código inválido.`);
      } else if (idsInscripciones.has(id)) {
        errores.push(`${prefijo}: código duplicado ${id}.`);
      } else {
        idsInscripciones.add(id);
      }

      const estudianteId = valor['estudianteId'];
      const periodoId = valor['periodoId'];
      const estado = valor['estado'];

      const estudiante = estudiantesRaw.find(
        item =>
          this.esObjeto(item) &&
          item['id'] === estudianteId
      );

      if (!estudiante) {
        errores.push(
          `${prefijo}: estudiante inexistente.`
        );
      }

      if (
        !periodos.some(
          periodo => periodo.id === periodoId
        )
      ) {
        errores.push(
          `${prefijo}: período inexistente.`
        );
      }

      if (
        !estados.some(
          opcion => opcion.id === estado
        )
      ) {
        errores.push(
          `${prefijo}: estado inválido.`
        );
      }

      if (!this.fechaValida(valor['fechaInscripcion'])) {
        errores.push(
          `${prefijo}: fecha de inscripción inválida.`
        );
      }

      if (
        !this.esTexto(valor['observaciones']) ||
        valor['observaciones'].length > 500
      ) {
        errores.push(
          `${prefijo}: observaciones inválidas.`
        );
      }

      if (
        !Array.isArray(valor['cursoIds']) ||
        valor['cursoIds'].length === 0
      ) {
        errores.push(
          `${prefijo}: debe contener al menos un curso.`
        );
      } else {

        const cursosIds = valor['cursoIds'] as unknown[];
        const ids = new Set<string>();

        cursosIds.forEach(cursoId => {

          if (!this.esTexto(cursoId)) {
            errores.push(
              `${prefijo}: identificador de curso inválido.`
            );
            return;
          }

          if (ids.has(cursoId)) {
            errores.push(
              `${prefijo}: curso duplicado ${cursoId}.`
            );
          }

          ids.add(cursoId);

          const curso = cursos.find(
            item => item.id === cursoId
          );

          if (!curso) {
            errores.push(
              `${prefijo}: curso inexistente ${cursoId}.`
            );
          } else if (
            estudiante &&
            this.esObjeto(estudiante) &&
            curso.carreraId !== estudiante['carreraId']
          ) {
            errores.push(
              `${prefijo}: ${cursoId} no pertenece ` +
              'a la carrera del estudiante.'
            );
          }
        });
      }

      // Solo una inscripción no cancelada
      // por estudiante y período.
      if (
        this.textoNoVacio(estudianteId) &&
        this.textoNoVacio(periodoId) &&
        estado !== 'Cancelada'
      ) {
        const clave = JSON.stringify([
          estudianteId,
          periodoId
        ]);

        if (inscripcionesPorPeriodo.has(clave)) {
          errores.push(
            `${prefijo}: inscripción no cancelada duplicada ` +
            'para el estudiante y período.'
          );
        } else {
          inscripcionesPorPeriodo.add(clave);
        }
      }
    });

    if (errores.length > 0) {
      return {
        valido: false,
        errores,
        respaldo: null,
        totalEstudiantes: estudiantesRaw.length,
        totalInscripciones: inscripcionesRaw.length
      };
    }

    // En este punto todos los registros han sido validados.
    const respaldo: BackupData = {
      version: this.VERSION,
      fechaExportacion: datos['fechaExportacion'] as string,
      estudiantes: estudiantesRaw as Student[],
      inscripciones: inscripcionesRaw as Enrollment[]
    };

    return {
      valido: true,
      errores: [],
      respaldo,
      totalEstudiantes: respaldo.estudiantes.length,
      totalInscripciones: respaldo.inscripciones.length
    };
  }

  // Validar nuevamente y reemplazar los datos
  async restaurar(
    respaldo: BackupData
  ): Promise<void> {

    const resultado = await this.validarRespaldo(respaldo);

    if (!resultado.valido || !resultado.respaldo) {
      throw new Error(
        'El respaldo ya no es válido: ' +
        resultado.errores.slice(0, 3).join(' ')
      );
    }

    const datos: StoredData = {
      estudiantes: resultado.respaldo.estudiantes,
      inscripciones: resultado.respaldo.inscripciones
    };

    // Una sola escritura para ambas colecciones.
    this.storage.replaceAll(datos);
  }

  // Obtener estadísticas actuales
  obtenerEstadisticas(): {
    estudiantes: number;
    inscripciones: number;
  } {

    const datos = this.storage.getData();

    return {
      estudiantes: datos.estudiantes.length,
      inscripciones: datos.inscripciones.length
    };
  }
}
