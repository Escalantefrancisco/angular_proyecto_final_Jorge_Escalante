
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';

import { Enrollment } from '../../models/enrollment.model';
import { Student } from '../../models/student.model';
import { Course, Period } from '../../models/course.model';

export interface EnrollmentDetailData {
  inscripcion: Enrollment;
  estudiante?: Student;
  periodo?: Period;
  cursos: Course[];
}

@Component({
  selector: 'app-enrollment-detail-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule
  ],
  templateUrl: './enrollment-detail-dialog.html',
  styleUrl: './enrollment-detail-dialog.scss'
})
export class EnrollmentDetailDialog {

  readonly data = inject<EnrollmentDetailData>(
    MAT_DIALOG_DATA
  );

  private dialogRef =
    inject<MatDialogRef<EnrollmentDetailDialog>>(
      MatDialogRef
    );

  readonly nombresCarreras: Record<string, string> = {
    SISTEMAS: 'Ingeniería en Sistemas',
    ADMINISTRACION: 'Administración',
    DERECHO: 'Derecho'
  };

  get inscripcion(): Enrollment {
    return this.data.inscripcion;
  }

  get totalCreditos(): number {
    return this.data.cursos.reduce(
      (total, curso) => total + curso.creditos,
      0
    );
  }

  get cantidadCursos(): number {
    return this.data.cursos.length;
  }

  get cursosFaltantes(): string[] {
    const idsEncontrados = new Set(
      this.data.cursos.map(curso => curso.id)
    );

    return this.inscripcion.cursoIds.filter(
      id => !idsEncontrados.has(id)
    );
  }

  obtenerCarrera(id: string): string {
    return this.nombresCarreras[id] ?? id;
  }

  cerrar(): void {
    this.dialogRef.close();
  }
}
