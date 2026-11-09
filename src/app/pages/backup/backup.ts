
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import {
  MatSnackBar,
  MatSnackBarModule
} from '@angular/material/snack-bar';

import {
  BackupService,
  BackupValidationResult
} from '../../services/backup';

import {
  ConfirmDialog,
  ConfirmDialogData
} from '../../shared/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-backup',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './backup.html',
  styleUrl: './backup.scss'
})
export class Backup implements OnInit {

  private backupService = inject(BackupService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  totalEstudiantes = 0;
  totalInscripciones = 0;

  archivoSeleccionado: File | null = null;
  resultado: BackupValidationResult | null = null;

  validando = false;
  restaurando = false;
  exportando = false;

  mensajeError = '';

  ngOnInit(): void {
    this.actualizarEstadisticas();
  }

  actualizarEstadisticas(): void {
    try {
      const datos = this.backupService.obtenerEstadisticas();

      this.totalEstudiantes = datos.estudiantes;
      this.totalInscripciones = datos.inscripciones;

    } catch (error) {
      this.mostrarError(error);
    }
  }

  exportarRespaldo(): void {

    if (this.exportando || this.restaurando) {
      return;
    }

    try {
      this.exportando = true;
      this.mensajeError = '';

      this.backupService.exportar();

      this.snackBar.open(
        'Se inició la descarga del respaldo JSON.',
        'Cerrar',
        { duration: 3500 }
      );

    } catch (error) {
      this.mostrarError(error);

    } finally {
      this.exportando = false;
    }
  }

  // Seleccionar un archivo JSON
  async seleccionarArchivo(
    event: Event
  ): Promise<void> {

    if (this.validando || this.restaurando) {
  return;
}

    const input = event.target as HTMLInputElement;
    const archivo = input.files?.[0] ?? null;

    // Permite seleccionar nuevamente el mismo archivo.
    input.value = '';

    this.archivoSeleccionado = archivo;
    this.resultado = null;
    this.mensajeError = '';

    if (!archivo) {
      return;
    }

    try {
      this.validando = true;

      const resultado =
        await this.backupService.validarArchivo(archivo);

      // Evitar que una validación anterior sobrescriba
      // el resultado de un archivo seleccionado después.
      if (this.archivoSeleccionado !== archivo) {
        return;
      }

      this.resultado = resultado;

      if (resultado.valido) {
        this.snackBar.open(
          'El respaldo pasó las validaciones.',
          'Cerrar',
          { duration: 3500 }
        );
      }

    } catch (error) {
      if (this.archivoSeleccionado === archivo) {
        this.mostrarError(error);
      }

    } finally {
      if (this.archivoSeleccionado === archivo) {
        this.validando = false;
      }
    }
  }

  // Quitar el archivo seleccionado
  limpiarSeleccion(): void {

    if (this.restaurando) {
      return;
    }

    this.archivoSeleccionado = null;
    this.resultado = null;
    this.mensajeError = '';
    this.validando = false;
  }

  // Confirmar antes de restaurar
  confirmarRestauracion(): void {

    if (
      this.validando ||
      this.restaurando ||
      !this.resultado?.valido ||
      !this.resultado.respaldo
    ) {
      return;
    }

    const respaldo = this.resultado.respaldo;

    const data: ConfirmDialogData = {
      titulo: 'Restaurar respaldo',
      mensaje:
        `Se reemplazarán todos los registros actuales ` +
        `por ${respaldo.estudiantes.length} estudiantes y ` +
        `${respaldo.inscripciones.length} inscripciones. ` +
        `¿Deseas continuar?`,
      textoConfirmar: 'Restaurar datos',
      advertencia:
        'Los registros actuales serán reemplazados. ' +
        'Exporta un respaldo antes de continuar.'
    };

    const referencia = this.dialog.open(ConfirmDialog, {
      width: '480px',
      maxWidth: '95vw',
      data,
      disableClose: true
    });

    referencia.afterClosed().subscribe(
      (confirmado: boolean | undefined) => {

        if (confirmado === true) {
          void this.restaurarRespaldo(respaldo);
        }
      }
    );
  }

  private async restaurarRespaldo(
    respaldo: NonNullable<BackupValidationResult['respaldo']>
  ): Promise<void> {

    if (this.restaurando) {
      return;
    }

    try {
      this.restaurando = true;
      this.mensajeError = '';

      await this.backupService.restaurar(respaldo);

      this.actualizarEstadisticas();
      this.limpiarResultadoTrasRestauracion();

      this.snackBar.open(
        'Respaldo restaurado correctamente.',
        'Cerrar',
        { duration: 4500 }
      );

    } catch (error) {
      this.mostrarError(error);

    } finally {
      this.restaurando = false;
    }
  }

  private limpiarResultadoTrasRestauracion(): void {
    this.archivoSeleccionado = null;
    this.resultado = null;
    this.mensajeError = '';
  }

  private mostrarError(error: unknown): void {

    this.mensajeError = error instanceof Error
      ? error.message
      : 'Ocurrió un error inesperado.';

    this.snackBar.open(
      this.mensajeError,
      'Cerrar',
      { duration: 6000 }
    );
  }
}
