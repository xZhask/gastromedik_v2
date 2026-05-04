<?php

namespace App\Controllers;

use App\Core\Base\BaseController;
use App\Core\Request;
use App\Services\ExamenesService;

class ExamenesController extends BaseController
{
    private ExamenesService $examenes;

    public function __construct()
    {
        $this->examenes = new ExamenesService();
    }

    public function index(Request $request): void
    {
        $this->json($this->examenes->listarPorPaciente((string) $request->get('dni', '')));
    }

    public function show(Request $request): void
    {
        $this->json($this->examenes->obtenerDetalle((int) $request->param('id', 0)));
    }

    public function showImagenes(Request $request): void
    {
        $this->json($this->examenes->obtenerImagenes((int) $request->param('id', 0)));
    }

    public function storeImgs(Request $request): void
    {
        $result = $this->examenes->registrarImagenes(
            (string) $request->post('idpaciente', ''),
            (string) $request->post('nombreexamen', ''),
            $_FILES
        );

        $this->json([
            'message'  => ($result['guardados'] ?? 0) > 0 ? 'Imagenes registradas' : 'No se guardaron imagenes',
            'guardados' => (int) ($result['guardados'] ?? 0),
        ], true, null, 201);
    }

    public function storePdf(Request $request): void
    {
        $this->examenes->registrarPdf(
            (string) $request->post('idpaciente', ''),
            (string) $request->post('nombreexamen', ''),
            $_FILES['mi-archivo'] ?? null
        );

        $this->json(['message' => 'PDF registrado'], true, null, 201);
    }

    public function destroy(Request $request): void
    {
        $this->examenes->eliminar((int) $request->param('id', 0));
        $this->noContent();
    }
}
