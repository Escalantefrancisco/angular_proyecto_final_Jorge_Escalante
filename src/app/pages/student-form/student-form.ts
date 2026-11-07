
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { Student, Contact } from '../../models/student.model';
import { Course } from '../../models/course.model';
import { CatalogOption } from '../../models/catalog.model';

import { StudentService } from '../../services/student';
import { EnrollmentService } from '../../services/enrollment';
import { CatalogService } from '../../services/catalog';

import {
  noWhitespaceValidator,
  studentCodeValidator,
  phoneValidator,
  birthDateValidator,
  minContactsValidator
} from '../../validators/custom.validators';

@Component({
  selector: 'app-student-form',
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
  templateUrl: './student-form.html',
  styleUrl: './student-form.scss'
})
export class StudentForm implements OnInit {

  private fb = inject(FormBuilder);
  studentService = inject(StudentService);
  private enrollmentService = inject(EnrollmentService);
  private catalogService = inject(CatalogService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  // Catálogos
  generos: CatalogOption[] = [];
  jornadas: CatalogOption[] = [];
  modalidades: CatalogOption[] = [];
  carreras: CatalogOption[] = [];

  // Control del formulario
  editando = false;
  cargando = true;
  guardando = false;
  mensajeError = '';

  estudianteId = '';
  fechaRegistroOriginal = '';

  // Fecha máxima para el input date
  fechaMaxima = this.obtenerFechaLocal();

  tiposContacto = [
    { id: 'Movil', nombre: 'Móvil' },
    { id: 'Casa', nombre: 'Casa' },
    { id: 'Trabajo', nombre: 'Trabajo' },
    { id: 'Otro', nombre: 'Otro' }
  ];

  // Formulario reactivo
  formulario: FormGroup = this.fb.group({
    id: [
      '',
      [
        Validators.required,
        studentCodeValidator()
      ]
    ],

    nombres: [
      '',
      [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(80),
        noWhitespaceValidator()
      ]
    ],

    apellidos: [
      '',
      [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(80),
        noWhitespaceValidator()
      ]
    ],

    fechaNacimiento: [
      '',
      [
        Validators.required,
        birthDateValidator()
      ]
    ],

    genero: ['', Validators.required],

    correo: [
      '',
      [
        Validators.required,
        Validators.email,
        Validators.maxLength(254)
      ]
    ],

    direccion: [
      '',
      [
        Validators.required,
        Validators.minLength(5),
        Validators.maxLength(200),
        noWhitespaceValidator()
      ]
    ],

    carreraId: ['', Validators.required],

    jornada: ['', Validators.required],

    modalidad: ['', Validators.required],

    contactos: this.fb.array(
      [],
      { validators: [minContactsValidator()] }
    )
  });

  // Acceso al FormArray
  get contactos(): FormArray {
    return this.formulario.get('contactos') as FormArray;
  }

  async ngOnInit(): Promise<void> {
    try {
      await this.cargarCatalogos();

      const id = this.route.snapshot.paramMap.get('id');

      if (id) {
        this.editando = true;
        this.estudianteId = id;
        this.cargarEstudiante(id);
      } else {
        this.agregarContacto();
      }

    } catch (error) {
      this.mensajeError =
        'No se pudieron cargar los catálogos. ' +
        'Comprueba los archivos JSON.';

      console.error(error);

    } finally {
      this.cargando = false;
    }
  }

  // Obtener fecha local en formato YYYY-MM-DD
  private obtenerFechaLocal(): string {
    const hoy = new Date();

    const year = hoy.getFullYear();
    const month = String(hoy.getMonth() + 1).padStart(2, '0');
    const day = String(hoy.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  // Cargar opciones desde archivos JSON
  private async cargarCatalogos(): Promise<void> {

    const [generos, jornadas, modalidades, cursos] =
      await Promise.all([
        firstValueFrom(this.catalogService.getGeneros()),
        firstValueFrom(this.catalogService.getJornadas()),
        firstValueFrom(this.catalogService.getModalidades()),
        firstValueFrom(this.catalogService.getCursos())
      ]);

    this.generos = generos;
    this.jornadas = jornadas;
    this.modalidades = modalidades;

    // Obtener carreras sin duplicados desde los cursos
    const idsCarreras = [
      ...new Set(cursos.map((curso: Course) => curso.carreraId))
    ];

    const nombres: Record<string, string> = {
      SISTEMAS: 'Ingeniería en Sistemas',
      ADMINISTRACION: 'Administración',
      DERECHO: 'Derecho'
    };

    this.carreras = idsCarreras.map(id => ({
      id,
      nombre: nombres[id] ?? id
    }));
  }

  // Crear un grupo para cada teléfono
  private crearContacto(contacto?: Contact): FormGroup {
    return this.fb.group({
      numero: [
        contacto?.numero ?? '',
        [
          Validators.required,
          phoneValidator()
        ]
      ],

      tipo: [
        contacto?.tipo ?? 'Movil',
        Validators.required
      ],

      activo: [
        contacto?.activo ?? true
      ]
    });
  }

  // Agregar teléfono
  agregarContacto(): void {
    this.contactos.push(this.crearContacto());
  }

  // Eliminar teléfono
  eliminarContacto(index: number): void {
    if (this.contactos.length <= 1) {
      this.snackBar.open(
        'Debes mantener al menos un contacto.',
        'Cerrar',
        { duration: 3500 }
      );
      return;
    }

    this.contactos.removeAt(index);
  }

  // Consultar estudiante existente
  private cargarEstudiante(id: string): void {

    const estudiante = this.studentService.getById(id);

    if (!estudiante) {
      this.mensajeError = 'El estudiante no existe.';
      return;
    }

    this.fechaRegistroOriginal = estudiante.fechaRegistro;

    this.formulario.patchValue({
      id: estudiante.id,
      nombres: estudiante.nombres,
      apellidos: estudiante.apellidos,
      fechaNacimiento: estudiante.fechaNacimiento,
      genero: estudiante.genero,
      correo: estudiante.correo,
      direccion: estudiante.direccion,
      carreraId: estudiante.carreraId,
      jornada: estudiante.jornada,
      modalidad: estudiante.modalidad
    });

    // No permitir modificar el código al editar
    this.formulario.get('id')?.disable();

    // Cargar teléfonos existentes
    this.contactos.clear();

    estudiante.contactos.forEach(contacto => {
      this.contactos.push(
        this.crearContacto(contacto)
      );
    });

    this.formulario.updateValueAndValidity();
  }

  // Obtener un mensaje de error por campo
  obtenerError(campo: string): string {

    const control = this.formulario.get(campo);

    if (!control || !control.errors) {
      return '';
    }
    if (control.hasError('duplicate')) {
  return 'Este código estudiantil ya está registrado.';
    }
    if (control.hasError('required')) {
      return 'Este campo es obligatorio.';
    }

    if (control.hasError('whitespace')) {
      return 'No se permiten solamente espacios.';
    }

    if (control.hasError('minlength')) {
      return `Mínimo ${control.errors['minlength'].requiredLength} caracteres.`;
    }

    if (control.hasError('maxlength')) {
      return `Máximo ${control.errors['maxlength'].requiredLength} caracteres.`;
    }

    if (control.hasError('email')) {
      return 'Ingresa un correo electrónico válido.';
    }

    if (control.hasError('studentCode')) {
      return 'Utiliza un código como EST-001.';
    }

    if (control.hasError('invalidDate')) {
      return 'Ingresa una fecha válida.';
    }

    if (control.hasError('futureDate')) {
      return 'La fecha no puede ser futura.';
    }

    return 'Revisa este campo.';
  }

  // Obtener error de un teléfono
  obtenerErrorContacto(index: number): string {

    const control = this.contactos.at(index).get('numero');

    if (!control || !control.errors) {
      return '';
    }

    if (control.hasError('required')) {
      return 'El número es obligatorio.';
    }

    if (control.hasError('phone')) {
      return 'Utiliza entre 8 y 15 dígitos, sin espacios.';
    }

    return 'Número inválido.';
  }

  // Verificar si un campo debe mostrar error
  mostrarError(campo: string): boolean {
    const control = this.formulario.get(campo);

    return !!(
      control &&
      control.invalid &&
      (control.touched || control.dirty)
    );
  }

  // Guardar estudiante
  guardar(): void {

    this.mensajeError = '';

    if (this.cargando || this.guardando) {
      return;
    }

    this.formulario.markAllAsTouched();

    if (this.formulario.invalid) {
      this.snackBar.open(
        'Corrige los campos marcados antes de guardar.',
        'Cerrar',
        { duration: 4000 }
      );
      return;
    }

    

    const camposTexto = [
  'id',
  'nombres',
  'apellidos',
  'correo',
  'direccion'
];

for (const campo of camposTexto) {
  const control = this.formulario.get(campo);
  const valor = control?.value;

  if (typeof valor === 'string') {
    control?.setValue(valor.trim());
  }
}

this.contactos.controls.forEach(contacto => {
  const numero = contacto.get('numero');

  if (typeof numero?.value === 'string') {
    numero.setValue(numero.value.trim());
  }
});

this.formulario.updateValueAndValidity();

if (this.formulario.invalid) {
  this.formulario.markAllAsTouched();

  this.snackBar.open(
    'Corrige los campos marcados antes de guardar.',
    'Cerrar',
    { duration: 4000 }
  );

  return;
}

const valores = this.formulario.getRawValue();

    // Limpiar espacios en campos de texto
    const estudiante: Student = {
      id: valores.id.trim(),
      nombres: valores.nombres.trim(),
      apellidos: valores.apellidos.trim(),
      fechaNacimiento: valores.fechaNacimiento,
      genero: valores.genero,
      correo: valores.correo.trim(),
      direccion: valores.direccion.trim(),
      carreraId: valores.carreraId,
      jornada: valores.jornada,
      modalidad: valores.modalidad,

      contactos: valores.contactos.map(
        (contacto: Contact) => ({
          numero: contacto.numero.trim(),
          tipo: contacto.tipo,
          activo: contacto.activo
        })
      ),

      fechaRegistro: this.editando
        ? this.fechaRegistroOriginal
        : new Date().toISOString()
    };

    try {
      this.guardando = true;

      // Evitar código duplicado
      if (
        !this.editando &&
        this.studentService.exists(estudiante.id)
      ) {
        this.formulario.get('id')?.setErrors({
          duplicate: true
        });

        throw new Error(
          'Ya existe un estudiante con ese código.'
        );
      }

      // Evitar romper relaciones de inscripciones existentes
      if (this.editando) {
        const anterior =
          this.studentService.getById(this.estudianteId);

        if (
          anterior &&
          anterior.carreraId !== estudiante.carreraId &&
          this.enrollmentService
            .getByStudent(this.estudianteId).length > 0
        ) {
          throw new Error(
            'No puedes cambiar la carrera porque el estudiante ' +
            'tiene inscripciones asociadas.'
          );
        }

        this.studentService.update(
          this.estudianteId,
          estudiante
        );

      } else {
        this.studentService.create(estudiante);
      }

      this.snackBar.open(
        this.editando
          ? 'Estudiante actualizado correctamente.'
          : 'Estudiante registrado correctamente.',
        'Cerrar',
        { duration: 3500 }
      );

      this.router.navigate(['/estudiantes']);

    } catch (error) {
      this.mensajeError = error instanceof Error
        ? error.message
        : 'Ocurrió un error al guardar.';

      this.snackBar.open(
        this.mensajeError,
        'Cerrar',
        { duration: 5000 }
      );

    } finally {
      this.guardando = false;
    }
  }

}
