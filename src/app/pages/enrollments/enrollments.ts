
import { Component, OnInit, ViewChild, inject } from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import {MatTableDataSource, MatTableModule } from '@angular/material/table';

import {MatPaginator, MatPaginatorModule } from '@angular/material/paginator';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { Enrollment } from '../../models/enrollment.model';
import { Student } from '../../models/student.model';
import { Course, Period } from '../../models/course.model';
import { CatalogOption } from '../../models/catalog.model';

import { EnrollmentService } from '../../services/enrollment';
import { StudentService } from '../../services/student';
import { CatalogService } from '../../services/catalog';

import { EnrollmentDetailDialog, EnrollmentDetailData } from '../enrollment-detail-dialog/enrollment-detail-dialog';

import { ConfirmDialog, ConfirmDialogData } from '../../shared/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-enrollments',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatTableModule,
    MatPaginatorModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDialogModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './enrollments.html',
  styleUrl: './enrollments.scss'
})
export class Enrollments implements OnInit {

  private enrollmentService = inject(EnrollmentService);
  private studentService = inject(StudentService);
  private catalogService = inject(CatalogService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  estudiantes: Student[] = [];
  cursos: Course[] = [];
  periodos: Period[] = [];
  estados: CatalogOption[] = [];

  // Columnas de la tabla
  columnas: string[] = [
    'id',
    'estudiante',
    'periodo',
    'fecha',
    'cursos',
    'estado',
    'acciones'
  ];

  dataSource = new MatTableDataSource<Enrollment>([]);

  // Filtros
  filtroEstudiante = '';
  filtroPeriodo = '';
  filtroEstado = '';

  // Estadísticas
  totalInscripciones = 0;
  totalCanceladas = 0;
  totalFiltradas = 0;

  cargando = true;
  procesando = false;
  mensajeError = '';



  async ngOnInit(): Promise<void> {
    this.configurarFiltro();
    await this.cargarDatos();
  }

  @ViewChild(MatPaginator)
set paginator(paginador: MatPaginator | undefined) {
  if (paginador) {
    this.dataSource.paginator = paginador;
  }
}

  // Cargar los catálogos y registros
  private async cargarDatos(): Promise<void> {
    try {
      this.cargando = true;
      this.mensajeError = '';

      const [cursos, periodos, estados] = await Promise.all([
        firstValueFrom(this.catalogService.getCursos()),
        firstValueFrom(this.catalogService.getPeriodos()),
        firstValueFrom(this.catalogService.getEstados())
      ]);

      this.cursos = cursos;
      this.periodos = periodos;
      this.estados = estados;

      this.cargarInscripciones();

    } catch (error) {
      this.mensajeError = error instanceof Error
        ? error.message
        : 'No fue posible cargar las inscripciones.';

      this.dataSource.data = [];

      this.snackBar.open(
        this.mensajeError,
        'Cerrar',
        { duration: 5500 }
      );

    } finally {
      this.cargando = false;
    }
  }

  // Obtener registros actualizados de localStorage
  cargarInscripciones(): void {

    this.estudiantes = this.studentService.getAll();

    const inscripciones = this.enrollmentService.getAll();

    this.dataSource.data = inscripciones;

    this.totalInscripciones = inscripciones.length;

    this.totalCanceladas = inscripciones.filter(
      inscripcion => inscripcion.estado === 'Cancelada'
    ).length;

    this.aplicarFiltros();
  }

  // Filtro combinado
  private configurarFiltro(): void {

    this.dataSource.filterPredicate = (
      inscripcion: Enrollment,
      filtro: string
    ): boolean => {

      const valores = JSON.parse(filtro) as {
        estudianteId: string;
        periodoId: string;
        estado: string;
      };

      const coincideEstudiante =
        !valores.estudianteId ||
        inscripcion.estudianteId === valores.estudianteId;

      const coincidePeriodo =
        !valores.periodoId ||
        inscripcion.periodoId === valores.periodoId;

      const coincideEstado =
        !valores.estado ||
        inscripcion.estado === valores.estado;

      return (
        coincideEstudiante &&
        coincidePeriodo &&
        coincideEstado
      );
    };
  }

  // Aplicar los tres filtros simultáneamente
  aplicarFiltros(): void {

    this.dataSource.filter = JSON.stringify({
      estudianteId: this.filtroEstudiante,
      periodoId: this.filtroPeriodo,
      estado: this.filtroEstado
    });

    this.totalFiltradas = this.dataSource.filteredData.length;

    this.dataSource.paginator?.firstPage();
  }

  // Restablecer filtros
  limpiarFiltros(): void {
    this.filtroEstudiante = '';
    this.filtroPeriodo = '';
    this.filtroEstado = '';

    this.aplicarFiltros();
  }

  // Consultar nombre del estudiante
  obtenerEstudiante(id: string): string {

    const estudiante = this.estudiantes.find(
      item => item.id === id
    );

    if (!estudiante) {
      return `Estudiante no encontrado (${id})`;
    }

    return `${estudiante.nombres} ${estudiante.apellidos}`;
  }

  // Consultar nombre del período
  obtenerPeriodo(id: string): string {

    const periodo = this.periodos.find(
      item => item.id === id
    );

    return periodo?.nombre ?? `Período no encontrado (${id})`;
  }

  // Obtener cursos de una inscripción
  obtenerCursos(inscripcion: Enrollment): Course[] {

    return this.cursos.filter(
      curso => inscripcion.cursoIds.includes(curso.id)
    );
  }

  // Contar cursos seleccionados
  contarCursos(inscripcion: Enrollment): number {
    return inscripcion.cursoIds.length;
  }

  // Calcular créditos
  calcularCreditos(inscripcion: Enrollment): number {

    return this.obtenerCursos(inscripcion).reduce(
      (total, curso) => total + curso.creditos,
      0
    );
  }

  // Mostrar detalles en MatDialog
  verDetalles(inscripcion: Enrollment): void {

    const estudiante = this.estudiantes.find(
      item => item.id === inscripcion.estudianteId
    );

    const periodo = this.periodos.find(
      item => item.id === inscripcion.periodoId
    );

    const data: EnrollmentDetailData = {
      inscripcion,
      estudiante,
      periodo,
      cursos: this.obtenerCursos(inscripcion)
    };

    this.dialog.open(EnrollmentDetailDialog, {
      width: '700px',
      maxWidth: '95vw',
      data,
      autoFocus: false
    });
  }

  // Verificar si se puede editar o cancelar
  puedeModificar(inscripcion: Enrollment): boolean {
    return inscripcion.estado !== 'Cancelada';
  }

  // Cancelar inscripción con confirmación
  cancelarInscripcion(inscripcion: Enrollment): void {

    if (this.procesando || !this.puedeModificar(inscripcion)) {
      return;
    }

    const data: ConfirmDialogData = {
      titulo: 'Cancelar inscripción',
      mensaje:
    `¿Deseas cancelar la inscripción ${inscripcion.id} ` +
    `del estudiante ${this.obtenerEstudiante(inscripcion.estudianteId)}?`,
     textoConfirmar: 'Cancelar inscripción',
      advertencia:
    'La inscripción permanecerá registrada en el historial, ' +
    'pero no podrá editarse después de cancelarla.'
    };

    const dialogRef = this.dialog.open(ConfirmDialog, {
      width: '450px',
      maxWidth: '95vw',
      data,
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(
      (confirmado: boolean | undefined) => {

        if (confirmado !== true || this.procesando) {
          return;
        }

        try {
          this.procesando = true;

          this.enrollmentService.cancel(inscripcion.id);

          this.snackBar.open(
            'Inscripción cancelada correctamente.',
            'Cerrar',
            { duration: 3500 }
          );

          this.cargarInscripciones();

        } catch (error) {

          const mensaje = error instanceof Error
            ? error.message
            : 'No fue posible cancelar la inscripción.';

          this.snackBar.open(
            mensaje,
            'Cerrar',
            { duration: 5500 }
          );

        } finally {
          this.procesando = false;
        }
      }
    );
  }
}
