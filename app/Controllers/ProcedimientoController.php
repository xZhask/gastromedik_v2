<?php

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Models\ProcedimientoModel;

class ProcedimientoController
{
    private ProcedimientoModel $procedimientos;

    public function __construct()
    {
        $this->procedimientos = new ProcedimientoModel();
    }

    /** GET /api/procedimientos?q= */
    public function index(Request $request): void
    {
        $filtro = $request->get('q', '');

        $filas = empty($filtro)
            ? $this->procedimientos->listar()
            : $this->procedimientos->buscar($filtro);

        $data = array_map(fn($f) => [
            'idtipoatencion' => (int) $f['idtipoatencion'],
            'nombre'         => $f['nombre'],
            'precio'         => $f['precio'],
        ], $filas);

        Response::json($data);
    }

    /** GET /api/procedimientos/buscar?nombre= */
    public function buscarNombre(Request $request): void
    {
        $nombre = $request->get('nombre', '');
        $filas  = $this->procedimientos->buscar($nombre);

        if (empty($filas)) {
            Response::json(['error' => 'No registrado'], 404);
        }

        Response::json($filas);
    }

    /** POST /api/procedimientos */
    public function store(Request $request): void
    {
        $body = $request->json();
        $this->procedimientos->registrar([
            'nombre' => $body['nombre'] ?? '',
            'precio' => $body['precio'] ?? '0',
        ]);
        Response::json(['message' => 'Procedimiento registrado'], 201);
    }

    /** PUT /api/procedimientos/{id} */
    public function update(Request $request): void
    {
        $body = $request->json();
        $this->procedimientos->actualizar([
            'idtipoatencion' => (int) $request->param('id'),
            'nombre'         => $body['nombre'] ?? '',
            'precio'         => $body['precio'] ?? '0',
        ]);
        Response::json(['message' => 'Procedimiento actualizado']);
    }

    /** DELETE /api/procedimientos/{id} */
    public function destroy(Request $request): void
    {
        $id = (int) $request->param('id');

        if ($this->procedimientos->tieneAtenciones($id)) {
            Response::json(['error' => 'No se puede eliminar: tiene atenciones registradas. Edite la información.'], 409);
        }

        $this->procedimientos->eliminar($id);
        Response::noContent();
    }
}
