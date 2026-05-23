<?php

namespace App\Controllers;

use App\Core\Auth;
use App\Core\Request;
use App\Core\Base\BaseController;
use App\Services\CitaService;

class CitaController extends BaseController
{
    private CitaService $citaService;

    private const MOTIVOS_CONSULTA = [
        'CONSULTA MÉDICA', 'CITA DE CONTROL', 'CONSULTA MÉDICA GASTROENTEROLOGIA ',
        'CONSULTA 0', 'CONSULTA GASTROENTEROLOGIA CON DESCUENTO',
        'CONSULTA - RESULTADO DE TEST DE ALIENTO', 'LECTURA DE TEST DE ALIENTO',
        'CONSULTA  NUTRICIONISTA', 'CONSULTA MEDICA ESPECIALIZADA (otras)',
        'CONSULTA O INTERCONSULTA PENDIENTE DE PAGO (CLINICAS)', 'CONSULTA LAB SALUD',
    ];

    public function __construct()
    {
        $this->citaService = new CitaService();
    }

    /** GET /api/citas?fecha=YYYY-MM-DD */
    public function index(Request $request): void
    {
        $cargo = (int) (Auth::user()['cargo'] ?? 0);
        $fecha = $request->get('fecha', date('Y-m-d'));
        $filas = $this->citaService->listarPorFecha($fecha);

        $data = array_map(function (array $fila) use ($cargo): array {
            $row = [
                'idcita'       => (int) $fila['idcita'],
                'horario'      => $fila['horario'],
                'paciente'     => $fila['paciente'],
                'dni'          => $fila['dni'],
                'motivo'       => $fila['motivo'],
                'telefono'     => $fila['telefono'],
                'estado'       => $fila['estado'],
                'atencion'     => null,
                'puede_anular' => $cargo === 1,
            ];

            $atencion = $fila['atencion'];
            if ($atencion !== null) {
                $row['atencion'] = [
                    'idatencion'  => (int) $atencion['idatencion'],
                    'estado'      => $atencion['estado'],
                    'es_consulta' => in_array($fila['motivo'], self::MOTIVOS_CONSULTA),
                ];
            }

            return $row;
        }, $filas);

        $this->json($data);
    }

    /** GET /api/citas/rango?start=...&end=... */
    public function rango(Request $request): void
    {
        $start = $request->get('start', date('Y-m-01'));
        $end   = $request->get('end', date('Y-m-t'));
        $filas = $this->citaService->listarEnRango($start, $end);
        
        $this->json($filas);
    }

    /** GET /api/citas/{id} */
    public function show(Request $request): void
    {
        $idcita = (int) ($request->param('id') ?? $request->get('id', 0));
        $cita   = $this->citaService->find($idcita);

        if ($cita === null) {
            $this->json([], false, 'Cita no encontrada', 404);
            return;
        }
        $this->json($cita);
    }

    /** POST /api/citas */
    public function store(Request $request): void
    {
        $body   = $request->json();
        $idcita = $this->citaService->registrar($body);
        $this->json(['idcita' => $idcita]);
    }

    /** PUT /api/citas/{id} */
    public function update(Request $request): void
    {
        $body   = $request->json();
        $idcita = (int) ($request->param('id') ?? 0);
        $this->citaService->actualizar($idcita, $body);
        $this->json(['message' => 'Cita actualizada']);
    }

    /** DELETE /api/citas/{id} */
    public function anular(Request $request): void
    {
        $this->citaService->anular((int) $request->param('id'));
        $this->json(['message' => 'Cita anulada']);
    }

    /** GET /api/citas/buscar?dni=... */
    public function buscar(Request $request): void
    {
        $dni   = $request->get('dni', '');
        $filas = $this->citaService->listarPorPaciente($dni);

        $data = array_map(fn(array $f): array => [
            'idcita'          => (int) $f['idcita'],
            'fecha'           => $f['fecha'],
            'horario'         => $f['horario'],
            'motivo'          => $f['motivo'],
            'estado'          => $f['estado'],
            'atencion_estado' => $f['atencion_estado'],
        ], $filas);

        $this->json($data);
    }

    /** GET /api/citas/confirmadas */
    public function confirmadas(Request $request): void
    {
        $fecha = date('Y/m/d');
        $cargo = (int) (Auth::user()['cargo'] ?? 0);
        $filas = $this->citaService->listarConfirmadas($fecha);

        $data = array_map(fn(array $f): array => [
            'idcita'           => (int) $f['idcita'],
            'idatencion'       => (int) $f['atencion']['idatencion'],
            'horario'          => $f['horario'],
            'paciente'         => $f['paciente'],
            'motivo'           => $f['motivo'],
            'tiene_pendientes' => $f['tiene_pendientes'],
            'es_consulta'      => in_array($f['motivo'], self::MOTIVOS_CONSULTA),
            'atencion_estado'  => $f['atencion']['estado'],
            'cargo'            => $cargo,
        ], $filas);

        $this->json($data);
    }

    /** GET /api/citas/pendientes */
    public function pendientes(Request $request): void
    {
        $filas = $this->citaService->listarPendientes();

        $data = array_map(fn(array $f): array => [
            'idcita'   => (int) $f['idcita'],
            'fecha'    => $f['fecha'],
            'horario'  => $f['horario'],
            'paciente' => $f['paciente'],
            'motivo'   => $f['motivo'],
            'telefono' => $f['telefono'],
            'estado'   => $f['estado'],
        ], $filas);

        $this->json($data);
    }

    /** POST /api/citas/externas */
    public function storeExterna(Request $request): void
    {
        $this->citaService->registrarExterna($request->json());
        $this->json(['message' => 'Cita externa registrada correctamente']);
    }

    /** GET /api/citas/externas?fecha1=&fecha2=&establecimiento= */
    public function externasIndex(Request $request): void
    {
        $fecha1          = $request->get('fecha1', '');
        $fecha2          = $request->get('fecha2', '');
        $establecimiento = $request->get('establecimiento', '');
        $filas           = $this->citaService->listarExternas($fecha1, $fecha2, $establecimiento);

        $data = array_map(fn(array $f): array => [
            'idtrabajoexterno' => (int) $f['idtrabajoexterno'],
            'hora'             => $f['hora'],
            'fecha'            => $f['fecha'],
            'paciente'         => $f['paciente'],
            'establecimiento'  => $f['establecimiento'],
            'motivo'           => $f['motivo'],
            'precio'           => $f['precio'],
            'estado'           => $f['estado'],
        ], $filas);

        $this->json($data);
    }

    /** DELETE /api/citas/externas/{id} */
    public function anularExterna(Request $request): void
    {
        $this->citaService->anularExterna((int) $request->param('id'));
        $this->json(['message' => 'Cita externa anulada']);
    }

    /** GET /api/citas/reporte-atenciones?fecha1=&fecha2=&tipoAtencion= */
    public function cantidadAtenciones(Request $request): void
    {
        $fecha1       = $request->get('fecha1', '');
        $fecha2       = $request->get('fecha2', '');
        $tipoAtencion = $request->get('tipoAtencion', '');
        $filas        = $this->citaService->contarPorTipoAtencion($fecha1, $fecha2, $tipoAtencion);

        $data = array_map(fn(array $f): array => [
            'tipo_atencion' => $f['tipo_atencion'],
            'cantidad'      => (int) $f['cantidad'],
        ], $filas);

        $this->json($data);
    }
}
