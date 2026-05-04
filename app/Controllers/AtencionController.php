<?php

namespace App\Controllers;

use App\Core\Base\BaseController;
use App\Core\Request;
use App\Services\AtencionService;

class AtencionController extends BaseController
{
    private AtencionService $service;

    public function __construct()
    {
        $this->service = new AtencionService();
    }

    /** GET /api/atenciones?fecha= */
    public function index(Request $request): void
    {
        $this->json($this->service->listarPorFecha($request->get('fecha', date('Y-m-d'))));
    }

    /** GET /api/atenciones/{id} */
    public function show(Request $request): void
    {
        $this->json($this->service->obtener((int) $request->param('id')));
    }

    /** GET /api/atenciones/paciente?dni= */
    public function porPaciente(Request $request): void
    {
        $this->json($this->service->listarPorPaciente($request->get('dni', '')));
    }

    /** GET /api/atenciones/antecedentes?dni= */
    public function antecedentesGenerales(Request $request): void
    {
        $this->json($this->service->antecedentesGenerales($request->get('dni', '')));
    }

    /** GET /api/atenciones/{id}/signos */
    public function signosVitales(Request $request): void
    {
        $signos = $this->service->signosVitales((int) $request->param('id'));
        $this->json($signos ?? (object) []);
    }

    /** POST /api/atenciones/guardar */
    public function store(Request $request): void
    {
        $this->service->guardarAtencion($request->json());
        $this->json(['message' => 'Atencion guardada correctamente']);
    }

    /** POST /api/atenciones/signos */
    public function registrarSignos(Request $request): void
    {
        $this->service->registrarSignos($request->json() ?: (array) $_POST);
        $this->json(['message' => 'Signos vitales registrados']);
    }
}
