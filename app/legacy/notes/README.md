# Legacy Archive

Esta carpeta conserva piezas retiradas del flujo activo para mantener el proyecto mas limpio sin perder historial.

## Archivos movidos
- `Models/AntecedenteAtencionModel.php`
  Ya no se usa. Fue reemplazado por `AntecedentesModel` y `AtencionService`, ademas su estrategia `ON DUPLICATE KEY UPDATE` no era confiable con el esquema actual.
- `Controllers/cie10.css`
  Archivo sin referencias activas y fuera de lugar dentro de `app/Controllers`.
- `formularios/*`
  Conjunto completo de pantallas legacy sin referencias desde la SPA actual, `config/routes.php` ni `app/Views`. Se conserva solo como respaldo historico.

- Ruta shim `/api/atenciones/subir-archivo`
  Se retiro del backend activo en la tercera pasada. No tenia referencias fuera de `app/legacy/formularios` y fue reemplazada por `/api/examenes/subir-pdf`.
## Codigo retirado del arbol activo
- `CitaModel::ultimoId()`
  Metodo sin referencias activas en el proyecto al momento de la limpieza.
- Ruta `/api/session` y `PageController::session()`
  Se retiro en la cuarta revision. La SPA obtiene `cargo`, `iduser` y `nombre` desde los metatags del shell y no habia llamadas activas al endpoint.
- Endpoints clinicos no consumidos: `/api/atenciones/{id}/examen`, `/api/atenciones/tratamiento` y `/api/atenciones/carrito*`
  Se retiraron en la cuarta revision. La SPA usa `/api/atenciones/{id}` para el detalle, `/api/atenciones/guardar` para guardar la atencion y `/pdf/receta/{id}` para lectura de receta.
