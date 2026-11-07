
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

import { Student } from '../../models/student.model';

@Component({
  selector: 'app-student-detail-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule
  ],
  templateUrl: './student-detail-dialog.html',
  styleUrl: './student-detail-dialog.scss'
})
export class StudentDetailDialog {

  readonly estudiante = inject<Student>(MAT_DIALOG_DATA);

  private dialogRef =
    inject<MatDialogRef<StudentDetailDialog>>(MatDialogRef);

  readonly carreras: Record<string, string> = {
    SISTEMAS: 'Ingeniería en Sistemas',
    ADMINISTRACION: 'Administración',
    DERECHO: 'Derecho'
  };

  obtenerCarrera(id: string): string {
    return this.carreras[id] ?? id;
  }

  cerrar(): void {
    this.dialogRef.close();
  }
}
