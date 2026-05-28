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
        if (!\App\Core\Auth::hasRole([1, 2, 4])) {
            $this->json([], false, 'No autorizado para subir imágenes', 403);
            return;
        }

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
        if (!\App\Core\Auth::hasRole([1, 2, 4])) {
            $this->json([], false, 'No autorizado para subir PDF', 403);
            return;
        }

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

    public function serveFile(Request $request): void
    {
        $type     = $request->param('type', '');
        $dni      = $request->param('dni', '');
        $filename = $request->param('filename', '');

        if (!in_array($type, ['pdf', 'imgs'], true)) {
            http_response_code(404); exit;
        }
        if (!preg_match('/^\d{8}$/', $dni)) {
            http_response_code(403); exit;
        }
        if (!preg_match('/^[\w.\-]+$/', $filename) || str_contains($filename, '..')) {
            http_response_code(403); exit;
        }

        $path = BASE_PATH . '/uploads/' . $type . '/' . $dni . '/' . $filename;
        if (!is_file($path)) {
            http_response_code(404); exit;
        }

        $mime = mime_content_type($path) ?: 'application/octet-stream';

        ob_end_clean();
        header('Content-Type: ' . $mime);
        header('Content-Length: ' . filesize($path));
        header('Content-Disposition: inline; filename="' . rawurlencode($filename) . '"');
        header('Cache-Control: private, max-age=3600');
        readfile($path);
        exit;
    }
}
