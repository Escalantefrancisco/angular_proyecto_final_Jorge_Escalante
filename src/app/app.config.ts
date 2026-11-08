
import {ApplicationConfig, provideZoneChangeDetection} from '@angular/core';

import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import {
  crearPaginadorEspanol} from './config/paginator-es';
  import { MatPaginatorIntl } from '@angular/material/paginator';

import {provideAnimationsAsync} from '@angular/platform-browser/animations/async';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  
  providers: [
    provideZoneChangeDetection({eventCoalescing: true}),
    provideRouter(routes),
    provideHttpClient(),
    provideAnimationsAsync(),
     {
  provide: MatPaginatorIntl,
  useFactory: crearPaginadorEspanol
}
  ]
};
