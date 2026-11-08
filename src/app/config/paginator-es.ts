
import { MatPaginatorIntl } from '@angular/material/paginator';

export function crearPaginadorEspanol(): MatPaginatorIntl {

  const paginador = new MatPaginatorIntl();

  paginador.itemsPerPageLabel = 'Registros por página:';
  paginador.nextPageLabel = 'Página siguiente';
  paginador.previousPageLabel = 'Página anterior';
  paginador.firstPageLabel = 'Primera página';
  paginador.lastPageLabel = 'Última página';

  paginador.getRangeLabel = (
    page: number,
    pageSize: number,
    length: number
  ): string => {

    if (length === 0 || pageSize === 0) {
      return `0 de ${length}`;
    }

    const inicio = page * pageSize;
    const fin = Math.min(inicio + pageSize, length);

    return `${inicio + 1} - ${fin} de ${length}`;
  };

  return paginador;
}
