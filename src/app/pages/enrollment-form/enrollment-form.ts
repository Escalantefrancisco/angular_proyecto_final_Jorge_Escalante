
import {Component, OnInit, inject} from '@angular/core';

import { CommonModule } from '@angular/common';

import {FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';

import {ActivatedRoute, Router, RouterLink} from '@angular/router';

import {validDateValidator} from '../../validators/custom.validators';

import { firstValueFrom } from 'rxjs';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import {
  MatSnackBar,
  MatSnackBarModule
} from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { Student } from '../../models/student.model';
import { Course, Period } from '../../models/course.model';
import {
  Enrollment,
  EnrollmentStatus
} from '../../models/enrollment.model';
import { CatalogOption } from '../../models/catalog.model';

import { StudentService } from '../../services/student';
import { EnrollmentService } from '../../services/enrollment';
import { CatalogService } from '../../services/catalog';


@Component({
  selector: 'app-enrollment-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatSnackBarModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './enrollment-form.html',
  styleUrl: './enrollment-form.scss'
})
export class EnrollmentForm implements OnInit {

  private fb = inject(FormBuilder);
  private studentService = inject(StudentService);
  private enrollmentService = inject(EnrollmentService);
  private catalogService = inject(CatalogService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  // Datos disponibles
  estudiantes: Student[] = [];
  cursos: Course[] = [];
  periodos: Period[] = [];
  estados: CatalogOption[] = [];

  // Datos filtrados
  cursosDisponibles: Course[] = [];
  periodosDisponibles: Period[] = [];

  // Estudiante seleccionado
  estudianteSeleccionado: Student | null = null;

  // Estado del formulario
  editando = false;
  cargando = true;
  guardando = false;
  mensajeError = '';
  errorCarga = false;

  inscripcionId = '';

  // Valores académicos
  totalCreditos = 0;
  totalCursos = 0;

  readonly nombresCarreras: Record<string, string> = {
    SISTEMAS: 'Ingeniería en Sistemas',
    ADMINISTRACION: 'Administración',
    DERECHO: 'Derecho'
  };

  // Formulario reactivo
  formulario: FormGroup = this.fb.group({

    id: [
      '',
      [
        Validators.required,
        Validators.pattern(/^INS-[A-Za-z0-9-]{1,20}$/)
      ]
    ],

    estudianteId: [
      '',
      Validators.required
    ],

    periodoId: [
      '',
      Validators.required
    ],

    fechaInscripcion: [
      this.obtenerFechaLocal(),
  [
    Validators.required,
    validDateValidator()
  ]
    ],

    estado: [
      'Registrada',
      Validators.required
    ],

    observaciones: [
      '',
      [
        Validators.maxLength(500)
      ]
    ],

    cursos: this.fb.array([])
  });

  // Acceso al FormArray
  get cursosFormArray(): FormArray {
    return this.formulario.get('cursos') as FormArray;
  }

  async ngOnInit(): Promise<void> {
    try {
      await this.cargarDatos();

      const id = this.route.snapshot.paramMap.get('id');

      if (id) {
        this.editando = true;
        this.inscripcionId = id;
        this.cargarInscripcion(id);
      }

    } catch (error) {
      this.errorCarga = true;

      this.mensajeError =
        'No se pudieron cargar los datos del formulario.';

      console.error(error);

    } finally {
      this.cargando = false;
    }
  }

  // Fecha local en formato YYYY-MM-DD
  private obtenerFechaLocal(): string {
    const hoy = new Date();

    const year = hoy.getFullYear();
    const month = String(hoy.getMonth() + 1).padStart(2, '0');
    const day = String(hoy.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  // Cargar estudiantes y catálogos
  private async cargarDatos(): Promise<void> {

    const [cursos, periodos, estados] = await Promise.all([
      firstValueFrom(this.catalogService.getCursos()),
      firstValueFrom(this.catalogService.getPeriodos()),
      firstValueFrom(this.catalogService.getEstados())
    ]);

    this.estudiantes = this.studentService.getAll();
    this.cursos = cursos;
    this.periodos = periodos;
    this.estados = estados;

    this.periodosDisponibles = periodos.filter(
      periodo => periodo.activo
    );
  }

  // Obtener nombre de carrera
  obtenerCarrera(id: string): string {
    return this.nombresCarreras[id] ?? id;
  }

  // Cuando cambia el estudiante
  cambiarEstudiante(): void {

    const estudianteId =
      this.formulario.get('estudianteId')?.value;

    this.estudianteSeleccionado =
      this.estudiantes.find(
        estudiante => estudiante.id === estudianteId
      ) ?? null;

    this.cursosDisponibles = [];

    this.cursosFormArray.clear();

    if (!this.estudianteSeleccionado) {
      this.actualizarTotales();
      return;
    }

    this.cursosDisponibles = this.cursos.filter(
      curso =>
        curso.carreraId ===
        this.estudianteSeleccionado?.carreraId
    );

    // Crear un checkbox por cada curso
    this.cursosDisponibles.forEach(() => {
      this.cursosFormArray.push(
        new FormControl(false, {
          nonNullable: true
        })
      );
    });

    this.actualizarTotales();
  }

  // Cambiar selección de cursos
  actualizarTotales(): void {

    const seleccionados =
      this.obtenerCursosSeleccionados();

    this.totalCursos = seleccionados.length;

    this.totalCreditos = this.cursosDisponibles
      .filter(curso => seleccionados.includes(curso.id))
      .reduce(
        (total, curso) => total + curso.creditos,
        0
      );
  }

  // Obtener IDs de cursos seleccionados
  obtenerCursosSeleccionados(): string[] {

    return this.cursosDisponibles
      .filter((curso, index) =>
        this.cursosFormArray.at(index)?.value === true
      )
      .map(curso => curso.id);
  }

  // Consultar inscripción para edición
  private cargarInscripcion(id: string): void {

    const inscripcion =
      this.enrollmentService.getById(id);

    if (!inscripcion) {
      this.errorCarga = true;
      this.mensajeError = 'La inscripción no existe.';
      return;
    }

    if (inscripcion.estado === 'Cancelada') {
      this.errorCarga = true;
      this.mensajeError =
        'No se puede editar una inscripción cancelada.';
      return;
    }

    const estudianteExiste = this.estudiantes.some(
  estudiante => estudiante.id === inscripcion.estudianteId
  );

  if (!estudianteExiste) {
  this.errorCarga = true;
  this.mensajeError =
    'El estudiante de esta inscripción ya no existe.';
  return;
}


    this.formulario.patchValue({
      id: inscripcion.id,
      estudianteId: inscripcion.estudianteId,
      periodoId: inscripcion.periodoId,
      fechaInscripcion: inscripcion.fechaInscripcion,
      estado: inscripcion.estado,
      observaciones: inscripcion.observaciones
    });

    // El código no se modifica
    this.formulario.get('id')?.disable();

    // Mantener visible el período original
    const periodoOriginal = this.periodos.find(
      periodo => periodo.id === inscripcion.periodoId
    );

    if (
      periodoOriginal &&
      !this.periodosDisponibles.some(
        periodo => periodo.id === periodoOriginal.id
      )
    ) {
      this.periodosDisponibles = [
        periodoOriginal,
        ...this.periodosDisponibles
      ];
    }
    if (!periodoOriginal) {
  this.errorCarga = true;
  this.mensajeError =
    'El período académico de esta inscripción ya no existe.';
  return;
}



    // Filtrar cursos según estudiante
    this.cambiarEstudiante();

    const cursosValidos = new Set(
  this.cursosDisponibles.map(curso => curso.id)
  );

  const cursosFaltantes = inscripcion.cursoIds.filter(
  id => !cursosValidos.has(id)
  );

  if (cursosFaltantes.length > 0) {
  this.errorCarga = true;
  this.mensajeError =
    'La inscripción contiene cursos que ya no existen ' +
    'o no pertenecen a la carrera del estudiante.';
  return;
  }


    // Marcar los cursos previamente seleccionados
    this.cursosDisponibles.forEach((curso, index) => {
      if (inscripcion.cursoIds.includes(curso.id)) {
        this.cursosFormArray.at(index).setValue(true);
      }
    });

    this.actualizarTotales();
  }

  // Mostrar errores por campo
  obtenerError(campo: string): string {

    const control = this.formulario.get(campo);

    if (!control?.errors) {
      return '';
    }

    if (control.hasError('required')) {
      return 'Este campo es obligatorio.';
    }
    if (control.hasError('invalidDate')) {
    return 'Ingresa una fecha válida.';
    }
    if (control.hasError('pattern')) {
      return 'Utiliza un código como INS-001.';
    }

    if (control.hasError('maxlength')) {
      return 'Máximo 500 caracteres.';
    }

    if (control.hasError('whitespace')) {
      return 'No se permiten solamente espacios.';
    }

    return 'Revisa este campo.';
  }

  mostrarError(campo: string): boolean {
    const control = this.formulario.get(campo);

    return !!(
      control &&
      control.invalid &&
      (control.touched || control.dirty)
    );
  }

  // Guardar inscripción
  async guardar(): Promise<void> {

    if (this.cargando || this.guardando || this.errorCarga) {
      return;
    }

    this.mensajeError = '';

    this.formulario.markAllAsTouched();

    if (this.formulario.invalid) {
      this.snackBar.open(
        'Completa los campos obligatorios.',
        'Cerrar',
        { duration: 4000 }
      );
      return;
    }

    const cursosSeleccionados =
      this.obtenerCursosSeleccionados();

    if (cursosSeleccionados.length === 0) {
      this.mensajeError =
        'Debes seleccionar al menos un curso.';

      this.snackBar.open(
        this.mensajeError,
        'Cerrar',
        { duration: 4000 }
      );
      return;
    }

    const valores = this.formulario.getRawValue();

    const inscripcion: Enrollment = {
      id: valores.id.trim(),
      estudianteId: valores.estudianteId,
      periodoId: valores.periodoId,
      cursoIds: cursosSeleccionados,
      estado: valores.estado as EnrollmentStatus,
      fechaInscripcion: valores.fechaInscripcion,
      observaciones: valores.observaciones.trim()
    };

    try {
      this.guardando = true;

      if (this.editando) {
        await this.enrollmentService.update(
          this.inscripcionId,
          inscripcion
        );
      } else {
        await this.enrollmentService.create(inscripcion);
      }

      this.snackBar.open(
        this.editando
          ? 'Inscripción actualizada correctamente.'
          : 'Inscripción registrada correctamente.',
        'Cerrar',
        { duration: 3500 }
      );

      await this.router.navigate(['/inscripciones']);

    } catch (error) {
      this.mensajeError = error instanceof Error
        ? error.message
        : 'No fue posible guardar la inscripción.';

      this.snackBar.open(
        this.mensajeError,
        'Cerrar',
        { duration: 5500 }
      );

    } finally {
      this.guardando = false;
    }
  }
}
