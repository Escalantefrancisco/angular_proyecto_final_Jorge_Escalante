
import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'Inicio - UniRegistro',
    loadComponent: () =>
      import('./pages/home/home')
        .then(m => m.Home)
  },
  {
    path: 'estudiantes',
    title: 'Estudiantes - UniRegistro',
    loadComponent: () =>
      import('./pages/students/students')
        .then(m => m.Students)
  },
  {
    path: 'estudiantes/nuevo',
    title: 'Nuevo estudiante - UniRegistro',
    loadComponent: () =>
      import('./pages/student-form/student-form')
        .then(m => m.StudentForm)
  },
  {
    path: 'estudiantes/editar/:id',
    title: 'Editar estudiante - UniRegistro',
    loadComponent: () =>
      import('./pages/student-form/student-form')
        .then(m => m.StudentForm)
  },
  {
    path: 'inscripciones',
    title: 'Inscripciones - UniRegistro',
    loadComponent: () =>
      import('./pages/enrollments/enrollments')
        .then(m => m.Enrollments)
  },
  {
    path: 'inscripciones/nueva',
    title: 'Nueva inscripción - UniRegistro',
    loadComponent: () =>
      import('./pages/enrollment-form/enrollment-form')
        .then(m => m.EnrollmentForm)
  },
  {
    path: 'inscripciones/editar/:id',
    title: 'Editar inscripción - UniRegistro',
    loadComponent: () =>
      import('./pages/enrollment-form/enrollment-form')
        .then(m => m.EnrollmentForm)
  },
  {
    path: 'respaldos',
    title: 'Respaldos - UniRegistro',
    loadComponent: () =>
      import('./pages/backup/backup')
        .then(m => m.Backup)
  },
  {
    path: '**',
    redirectTo: ''
  }
];
