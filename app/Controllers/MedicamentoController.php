<?php

namespace App\Controllers;

use App\Core\Auth;
use App\Core\Base\BaseController;
use App\Core\Request;
use App\Services\MedicamentoService;

class MedicamentoController extends BaseController
{
    private MedicamentoService $medicamentos;

    public function __construct()
    {
        $this->medicamentos = new MedicamentoService();
    }

    public function index(Request $request): void
    {
        $this->json($this->medicamentos->listar((string) $request->get('q', '')));
    }

    public function nombres(Request $request): void
    {
        $this->json($this->medicamentos->nombres());
    }

    public function buscarNombre(Request $request): void
    {
        $this->json($this->medicamentos->buscarNombre((string) $request->get('q', '')));
    }

    public function store(Request $request): void
    {
        $this->medicamentos->registrar($request->json(), (string) Auth::id());
        $this->json(['message' => 'Medicamento registrado'], true, null, 201);
    }

    public function update(Request $request): void
    {
        $this->medicamentos->actualizar((int) $request->param('id', 0), $request->json());
        $this->json(['message' => 'Medicamento actualizado']);
    }

    public function destroy(Request $request): void
    {
        $this->medicamentos->eliminar((int) $request->param('id', 0));
        $this->noContent();
    }

    public function registrarMovimiento(Request $request): void
    {
        $this->medicamentos->registrarMovimiento($request->json(), (string) Auth::id());
        $this->json(['message' => 'Movimiento registrado'], true, null, 201);
    }
}
