<?php

namespace App\Controllers;

use App\Core\Request;
use App\Core\Base\BaseController;
use App\Services\EstablecimientoService;

class EstablecimientoController extends BaseController
{
    private EstablecimientoService $service;

    public function __construct()
    {
        $this->service = new EstablecimientoService();
    }

    /** GET /api/establecimientos */
    public function index(Request $_request): void
    {
        $filas = $this->service->listar();
        $data  = array_map(fn(array $f): array => [
            'idhospital' => (int) $f['idhospital'],
            'nombre'     => $f['nombre'],
        ], $filas);
        $this->json($data);
    }

    /** GET /api/establecimientos/tipo-atenciones */
    public function tipoAtenciones(Request $_request): void
    {
        $filas = $this->service->listarTipoAtenciones();
        $data  = array_map(fn(array $f): array => [
            'idtipoatencion' => (int) $f['idtipoatencion'],
            'nombre'         => $f['nombre'],
        ], $filas);
        $this->json($data);
    }

    /** POST /api/establecimientos */
    public function store(Request $request): void
    {
        $body = $request->json();
        $this->service->registrar($body['nombre'] ?? '');
        $this->json(['message' => 'Establecimiento registrado'], true, null, 201);
    }
}
