<?php

namespace App\Controllers;

use App\Core\Request;
use App\Core\Base\BaseController;
use App\Services\ProcedimientoService;

class ProcedimientoController extends BaseController
{
    private ProcedimientoService $service;

    public function __construct()
    {
        $this->service = new ProcedimientoService();
    }

    /** GET /api/procedimientos?q= */
    public function index(Request $request): void
    {
        $filtro = $request->get('q', '');
        $filas  = $this->service->listar($filtro);

        $data = array_map(fn(array $f): array => [
            'idtipoatencion' => (int) $f['idtipoatencion'],
            'nombre'         => $f['nombre'],
            'precio'         => $f['precio'],
        ], $filas);

        $this->json($data);
    }

    /** GET /api/procedimientos/buscar?nombre= */
    public function buscarNombre(Request $request): void
    {
        $nombre = $request->get('nombre', '');
        $filas  = $this->service->buscarPorNombre($nombre);

        if (empty($filas)) {
            $this->json([], false, 'No registrado', 404);
            return;
        }

        $this->json($filas);
    }

    /** POST /api/procedimientos */
    public function store(Request $request): void
    {
        $this->service->registrar($request->json());
        $this->json(['message' => 'Procedimiento registrado'], true, null, 201);
    }

    /** PUT /api/procedimientos/{id} */
    public function update(Request $request): void
    {
        $this->service->actualizar((int) $request->param('id'), $request->json());
        $this->json(['message' => 'Procedimiento actualizado']);
    }

    /** DELETE /api/procedimientos/{id} */
    public function destroy(Request $request): void
    {
        $this->service->eliminar((int) $request->param('id'));
        $this->noContent();
    }
}
