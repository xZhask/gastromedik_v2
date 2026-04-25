<?php

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Models\EstablecimientoModel;

class EstablecimientoController
{
    private EstablecimientoModel $establecimientos;

    public function __construct()
    {
        $this->establecimientos = new EstablecimientoModel();
    }

    /** GET /api/establecimientos */
    public function index(Request $request): void
    {
        $filas = $this->establecimientos->listarEstablecimientos();
        $data  = array_map(fn($f) => [
            'idhospital' => (int) $f['idhospital'],
            'nombre'     => $f['nombre'],
        ], $filas);
        Response::json($data);
    }

    /** GET /api/establecimientos/tipo-atenciones */
    public function tipoAtenciones(Request $request): void
    {
        $filas = $this->establecimientos->listarTipoAtenciones();
        $data  = array_map(fn($f) => [
            'idtipoatencion' => (int) $f['idtipoatencion'],
            'nombre'         => $f['nombre'],
        ], $filas);
        Response::json($data);
    }

    /** POST /api/establecimientos */
    public function store(Request $request): void
    {
        $body = $request->json();
        $this->establecimientos->registrarEstablecimiento($body['nombre'] ?? '');
        Response::json(['message' => 'Establecimiento registrado'], 201);
    }
}
