
import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';

import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

import { StudentService } from '../../services/student';
import { EnrollmentService } from '../../services/enrollment';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    RouterLink,
    MatCardModule,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class Home implements OnInit {

  private studentService = inject(StudentService);
  private enrollmentService = inject(EnrollmentService);

  totalEstudiantes = 0;
  totalInscripciones = 0;
  inscripcionesActivas = 0;
  inscripcionesCanceladas = 0;

  ngOnInit(): void {
    this.cargarEstadisticas();
  }

  cargarEstadisticas(): void {

    this.totalEstudiantes =
      this.studentService.count();

    const inscripciones =
      this.enrollmentService.getAll();

    this.totalInscripciones = inscripciones.length;

    this.inscripcionesCanceladas =
      inscripciones.filter(
        inscripcion =>
          inscripcion.estado === 'Cancelada'
      ).length;

    this.inscripcionesActivas =
      inscripciones.filter(
        inscripcion =>
          inscripcion.estado !== 'Cancelada' &&
          inscripcion.estado !== 'Rechazada'
      ).length;
  }

}
