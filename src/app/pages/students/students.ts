
import {
  AfterViewInit,
  Component,
  OnInit,
  ViewChild,
  inject
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

import {
  MatTableDataSource,
  MatTableModule
} from '@angular/material/table';

import {
  MatPaginator,
  MatPaginatorModule
} from '@angular/material/paginator';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';

import { Student } from '../../models/student.model';
import { StudentService } from '../../services/student';

import {
  StudentDetailDialog
} from '../student-detail-dialog/student-detail-dialog';

import {
  ConfirmDialog,
  ConfirmDialogData
} from '../../shared/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-students',
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
    MatInputModule,
    MatDialogModule,
    MatSnackBarModule,
    MatTooltipModule
  ],
  templateUrl: './students.html',
  styleUrl: './students.scss'
})
export class Students implements OnInit, AfterViewInit {

  private studentService = inject(StudentService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  // Columnas de la tabla
  columnas: string[] = [
    'id',
    'nombre',
    'correo',
    'carrera',
    'contactos',
    'acciones'
  ];

  // Fuente de datos para MatTable
  dataSource = new MatTableDataSource<Student>([]);

  // Buscador
  textoBusqueda = '';

  // Cantidad de registros
  totalEstudiantes = 0;

  // Control de errores
  mensajeError = '';

  // Paginador
  @ViewChild(MatPaginator)
  paginator!: MatPaginator;

  // Nombres de carreras
  carreras: Record<string, string> = {
    SISTEMAS: 'Ingeniería en Sistemas',
    ADMINISTRACION: 'Administración',
    DERECHO: 'Derecho'
  };

  ngOnInit(): void {
    this.configurarFiltro();
    this.cargarEstudiantes();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
  }

  // Configurar búsqueda
  private configurarFiltro(): void {

    this.dataSource.filterPredicate = (
      estudiante: Student,
      filtro: string
    ): boolean => {

      const contenido = [
        estudiante.id,
        estudiante.nombres,
        estudiante.apellidos,
        estudiante.correo
      ]
        .join(' ')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

      return contenido.includes(filtro);
    };
  }

  // Consultar estudiantes desde el servicio
  cargarEstudiantes(): void {
    try {
      this.mensajeError = '';

      const estudiantes = this.studentService.getAll();

      this.dataSource.data = estudiantes;
      this.totalEstudiantes = estudiantes.length;

      // Mantener el filtro actual
      this.aplicarFiltro();

    } catch (error) {
      this.mensajeError = error instanceof Error
        ? error.message
        : 'No fue posible cargar los estudiantes.';

      this.dataSource.data = [];
      this.totalEstudiantes = 0;

      this.snackBar.open(
        this.mensajeError,
        'Cerrar',
        { duration: 5000 }
      );
    }
  }

  // Buscar por código, nombre, apellido o correo
  aplicarFiltro(): void {

    const filtro = this.textoBusqueda
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    this.dataSource.filter = filtro;

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  // Limpiar buscador
  limpiarBusqueda(): void {
    this.textoBusqueda = '';
    this.aplicarFiltro();
  }

  // Obtener nombre de carrera
  obtenerCarrera(carreraId: string): string {
    return this.carreras[carreraId] ?? carreraId;
  }

  // Consultar detalles del estudiante
  verDetalles(estudiante: Student): void {

    this.dialog.open(StudentDetailDialog, {
      width: '650px',
      maxWidth: '95vw',
      data: estudiante,
      autoFocus: false
    });
  }

  // Solicitar confirmación de eliminación
  eliminarEstudiante(estudiante: Student): void {

    const data: ConfirmDialogData = {
      titulo: 'Eliminar estudiante',
      mensaje:
        `¿Deseas eliminar al estudiante ` +
        `${estudiante.nombres} ${estudiante.apellidos} ` +
        `(${estudiante.id})?`,
      textoConfirmar: 'Eliminar'
    };

    const dialogRef = this.dialog.open(ConfirmDialog, {
      width: '430px',
      maxWidth: '95vw',
      data,
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(
      (confirmado: boolean | undefined) => {

        if (confirmado !== true) {
          return;
        }

        try {
          this.studentService.delete(estudiante.id);

          this.snackBar.open(
            'Estudiante eliminado correctamente.',
            'Cerrar',
            { duration: 3500 }
          );

          this.cargarEstudiantes();

        } catch (error) {

          const mensaje = error instanceof Error
            ? error.message
            : 'No fue posible eliminar el estudiante.';

          this.snackBar.open(
            mensaje,
            'Cerrar',
            { duration: 6000 }
          );
        }
      }
    );
  }
}
