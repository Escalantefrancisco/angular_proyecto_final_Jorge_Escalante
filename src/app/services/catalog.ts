
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Course, Period } from '../models/course.model';
import { CatalogOption } from '../models/catalog.model';

@Injectable({
  providedIn: 'root'
})
export class CatalogService {

  private http = inject(HttpClient);

  private readonly baseUrl = 'data/';

  getCursos(): Observable<Course[]> {
    return this.http.get<Course[]>(
      `${this.baseUrl}cursos.json`
    );
  }

  getPeriodos(): Observable<Period[]> {
    return this.http.get<Period[]>(
      `${this.baseUrl}periodos.json`
    );
  }

  getGeneros(): Observable<CatalogOption[]> {
    return this.http.get<CatalogOption[]>(
      `${this.baseUrl}generos.json`
    );
  }

  getJornadas(): Observable<CatalogOption[]> {
    return this.http.get<CatalogOption[]>(
      `${this.baseUrl}jornadas.json`
    );
  }

  getModalidades(): Observable<CatalogOption[]> {
    return this.http.get<CatalogOption[]>(
      `${this.baseUrl}modalidades.json`
    );
  }

  getEstados(): Observable<CatalogOption[]> {
    return this.http.get<CatalogOption[]>(
      `${this.baseUrl}estados.json`
    );
  }

}
