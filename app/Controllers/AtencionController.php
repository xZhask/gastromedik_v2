<?php

namespace App\Controllers;

use App\Core\Base\BaseController;
use App\Core\Request;
use App\Core\Session;
use App\Models\AtencionModel;
use App\Models\AntecedentesModel;
use App\Services\AtencionService;

class AtencionController extends BaseController
{
    private AtencionModel $atencion;
    private AntecedentesModel $antecedentes;
    private AtencionService $service;

    public function __construct()
    {
        $this->atencion = new AtencionModel();
        $this->antecedentes = new AntecedentesModel();
        $this->service = new AtencionService();
    }

    /** GET /api/atenciones?fecha= */
    public function index(Request $request): void
    {
        $fecha = $request->get('fecha', date('Y-m-d'));
        $rows = $this->atencion->listarPorFecha($fecha);

        $data = array_map(fn($r) => [
            'idatencion'    => (int) $r['idatencion'],
            'fechaatencion' => $r['fechaatencion'],
            'paciente'      => trim($r['nombre'] . ' ' . $r['apellidos']),
            'dni'           => $r['idpaciente'],
            'motivo'        => $r['motivoconsulta'] ?? '',
            'estado'        => $r['estado'],
        ], $rows);

        $this->json($data);
    }

    /** GET /api/atenciones/{id} */
    public function show(Request $request): void
    {
        $id = (int) $request->param('id');
        $atencion = $this->atencion->obtenerConDetalles($id);

        if (!$atencion) {
            $this->json([], false, 'Atencion no encontrada', 404);
            return;
        }

        $this->json($atencion);
    }

    /** GET /api/atenciones/paciente?dni= */
    public function porPaciente(Request $request): void
    {
        $dni = $request->get('dni', '');
        $rows = $this->atencion->listarPorPaciente($dni);

        $data = array_map(fn($r) => [
            'idatencion' => (int) $r['idatencion'],
            'fecha'      => $r['fechaatencion'],
            'nombre'     => $r['motivoconsulta'] ?? 'Consulta',
            'tipo'       => $r['estado'],
        ], $rows);

        $this->json($data);
    }

    /** GET /api/atenciones/antecedentes?dni= */
    public function antecedentesGenerales(Request $request): void
    {
        $dni = $request->get('dni', '');
        $generales = $this->antecedentes->findGeneralesByDni($dni) ?? [];
        $atencion = $this->antecedentes->findUltimosAtencionByDni($dni) ?? [];

        $this->json(array_merge($generales, $atencion));
    }

    /** GET /api/atenciones/{id}/signos */
    public function signosVitales(Request $request): void
    {
        $id = (int) $request->param('id');
        $signos = $this->atencion->obtenerSignos($id);

        $this->json($signos ?? (object) []);
    }

    /** GET /api/atenciones/{id}/examen */
    public function showExamen(Request $request): void
    {
        $id = (int) $request->param('id');
        $atencion = $this->atencion->obtenerConDetalles($id);

        if (!$atencion) {
            $this->json([], false, 'Atencion no encontrada', 404);
            return;
        }

        $this->json([
            'idatencion' => (int) $atencion['idatencion'],
            'examen'     => $atencion['examen'] ?? '',
        ]);
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

    /** POST /api/atenciones/tratamiento */
    public function registrarTratamiento(Request $request): void
    {
        $idTratamiento = $this->service->registrarTratamiento($request->json());
        $this->json(['idtratamiento' => $idTratamiento]);
    }

    /** POST /api/atenciones/subir-archivo - delegado a ExamenesController */
    public function subirArchivo(Request $request): void
    {
        $this->json([], false, 'Use /api/examenes/subir-pdf', 301);
    }

    /** POST /api/atenciones/carrito */
    public function agregarCarrito(Request $request): void
    {
        $body = $request->json();
        $codigo = $body['codigo'] ?? uniqid('item_');

        $carrito = Session::get('carrito', []);
        $carrito[$codigo] = [
            'codigo' => $codigo,
            'nombre' => $body['nombre'] ?? '',
            'precio' => (float) ($body['precio'] ?? 0),
            'idtipo' => $body['idtipo'] ?? null,
        ];

        Session::set('carrito', $carrito);
        $this->json(['carrito' => array_values($carrito)]);
    }

    /** DELETE /api/atenciones/carrito/{codigo} */
    public function quitarCarrito(Request $request): void
    {
        $codigo = $request->param('codigo') ?? '';
        $carrito = Session::get('carrito', []);
        unset($carrito[$codigo]);
        Session::set('carrito', $carrito);

        $this->json(['carrito' => array_values($carrito)]);
    }

    /** DELETE /api/atenciones/carrito */
    public function cancelarCarrito(Request $request): void
    {
        Session::set('carrito', []);
        $this->json(['message' => 'Carrito vaciado']);
    }
}
