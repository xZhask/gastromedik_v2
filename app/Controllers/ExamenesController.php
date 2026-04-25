<?php

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Models\ExamenesModel;

class ExamenesController
{
    private ExamenesModel $examenes;

    public function __construct()
    {
        $this->examenes = new ExamenesModel();
    }

    /** GET /api/examenes?dni= */
    public function index(Request $request): void
    {
        $dni   = $request->get('dni', '');
        $filas = $this->examenes->listarPorPaciente($dni);

        $data = array_map(function ($f) {
            $fecha = date_create($f['fecha']);
            return [
                'idexamen'  => (int) $f['idexamen'],
                'fecha'     => date_format($fecha, 'd-m-Y H:i'),
                'nombre'    => $f['nombre'],
                'tipo'      => $f['tipoexamen'], // 'IMG' | 'PDF'
            ];
        }, $filas);

        Response::json($data);
    }

    /** GET /api/examenes/{id} */
    public function show(Request $request): void
    {
        $idexamen = (int) $request->param('id');
        $detalle  = $this->examenes->obtenerDetalle($idexamen);
        Response::json($detalle);
    }

    /** GET /api/examenes/{id}/imagenes */
    public function showImagenes(Request $request): void
    {
        $idexamen = (int) $request->param('id');
        $detalle  = $this->examenes->obtenerDetalle($idexamen);
        $data     = array_map(fn($f) => ['archivo' => $f['archivo']], $detalle);
        Response::json($data);
    }

    /** POST /api/examenes/subir-imagenes — multipart/form-data */
    public function storeImgs(Request $request): void
    {
        $idpaciente = $request->post('idpaciente', '');
        $nombre     = $request->post('nombreexamen', '');

        if ($idpaciente === '' || $nombre === '') {
            Response::json(['error' => 'Datos incompletos'], 400);
        }

        $idexamen = $this->examenes->registrar([
            'dni'        => $idpaciente,
            'nombre'     => $nombre,
            'fecha'      => date('Y/m/d H:i:s'),
            'tipoexamen' => 'IMG',
        ]);

        $dir = BASE_PATH . '/uploads/imgs/' . $idpaciente . '/';
        if (!is_dir($dir)) mkdir($dir, 0777, true);

        $guardados = 0;
        for ($i = 1; $i <= 6; $i++) {
            $file = $_FILES['foto' . $i] ?? null;
            if (!$file || $file['error'] !== UPLOAD_ERR_OK || $file['size'] === 0) continue;
            $filename = time() . $i . '.jpg';
            if (move_uploaded_file($file['tmp_name'], $dir . $filename)) {
                $this->examenes->registrarDetalle([
                    'idexamen' => $idexamen,
                    'archivo'  => 'uploads/imgs/' . $idpaciente . '/' . $filename,
                ]);
                $guardados++;
            }
        }

        Response::json([
            'message' => $guardados > 0 ? 'Imagenes registradas' : 'No se guardaron imagenes',
            'guardados' => $guardados,
        ], 201);
    }

    /** POST /api/examenes/subir-pdf — multipart/form-data */
    public function storePdf(Request $request): void
    {
        $idpaciente = $request->post('idpaciente', '');
        $nombre     = $request->post('nombreexamen', '');
        $file       = $_FILES['mi-archivo'] ?? null;

        if ($idpaciente === '' || $nombre === '' || !$file || $file['error'] !== UPLOAD_ERR_OK) {
            Response::json(['error' => 'Datos incompletos o error en el archivo'], 400);
        }

        $idexamen = $this->examenes->registrar([
            'dni'        => $idpaciente,
            'nombre'     => $nombre,
            'fecha'      => date('Y/m/d H:i:s'),
            'tipoexamen' => 'PDF',
        ]);

        $dir = BASE_PATH . '/uploads/pdf/' . $idpaciente . '/';
        if (!is_dir($dir)) mkdir($dir, 0777, true);

        $filename = time() . '.pdf';
        if (move_uploaded_file($file['tmp_name'], $dir . $filename)) {
            $this->examenes->registrarDetalle([
                'idexamen' => $idexamen,
                'archivo'  => 'uploads/pdf/' . $idpaciente . '/' . $filename,
            ]);
            Response::json(['message' => 'PDF registrado'], 201);
        }

        Response::json(['error' => 'Error al guardar el archivo'], 500);
    }

    /** DELETE /api/examenes/{id} */
    public function destroy(Request $request): void
    {
        $idexamen = (int) $request->param('id');
        $this->examenes->eliminarDetalle($idexamen);
        $this->examenes->eliminar($idexamen);
        Response::noContent();
    }
}
