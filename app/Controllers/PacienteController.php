<?php

namespace App\Controllers;

use App\Core\Auth;
use App\Core\Base\BaseController;
use App\Core\Request;
use App\Services\PacienteService;

class PacienteController extends BaseController
{
    private PacienteService $pacientes;

    public function __construct()
    {
        $this->pacientes = new PacienteService();
    }

    public function index(Request $request): void
    {
        $filtro = (string) $request->get('q', '');
        $cargo  = (int) (Auth::user()['cargo'] ?? 0);
        $this->json($this->pacientes->listar($filtro, $cargo));
    }

    public function show(Request $request): void
    {
        $dni = (string) ($request->param('dni') ?? $request->get('dni', ''));
        $this->json($this->pacientes->obtener($dni));
    }

    public function store(Request $request): void
    {
        $this->pacientes->registrar($request->json());
        $this->json(['message' => 'Paciente registrado'], true, null, 201);
    }

    public function update(Request $request): void
    {
        $this->pacientes->actualizar((string) ($request->param('dni') ?? ''), $request->json());
        $this->json(['message' => 'Paciente actualizado']);
    }

    public function destroy(Request $request): void
    {
        $this->pacientes->eliminar((string) ($request->param('dni') ?? ''));
        $this->noContent();
    }
}
