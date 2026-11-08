
import {
  AbstractControl,
  ValidationErrors,
  ValidatorFn
} from '@angular/forms';

// Rechazar textos vacíos o compuestos por espacios
export function noWhitespaceValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    if (typeof value !== 'string') {
      return null;
    }

    if (value.length > 0 && value.trim().length === 0) {
      return { whitespace: true };
    }

    return null;
  };
}

// Validar el código estudiantil
export function studentCodeValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    if (!value) {
      return null;
    }

    const regex = /^EST-[A-Za-z0-9-]{1,20}$/;

    return regex.test(value)
      ? null
      : { studentCode: true };
  };
}

// Validar números telefónicos
export function phoneValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    if (!value) {
      return null;
    }

    // Entre 8 y 15 dígitos, con + opcional al inicio
    const regex = /^\+?[0-9]{8,15}$/;

    return regex.test(value)
      ? null
      : { phone: true };
  };
}

// Validar fechas reales y no futuras
export function birthDateValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    if (!value) {
      return null;
    }

    if (
      typeof value !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(value)
    ) {
      return { invalidDate: true };
    }

    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(year, month - 1, day);

    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      return { invalidDate: true };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (date > today) {
      return { futureDate: true };
    }

    return null;
  };
}

// Validar que exista al menos un contacto
export function minContactsValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    return Array.isArray(value) && value.length > 0
      ? null
      : { minContacts: true };
  };
}


export function validDateValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {

    const value = control.value;

    if (!value) {
      return null;
    }

    if (
      typeof value !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(value)
    ) {
      return { invalidDate: true };
    }

    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(year, month - 1, day);

    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      return { invalidDate: true };
    }

    return null;
  };
}
