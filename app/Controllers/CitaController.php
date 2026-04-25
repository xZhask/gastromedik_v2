<?php

namespace App\Controllers;

use App\Core\Auth;
use App\Core\Request;
use App\Models\AtencionModel;
use App\Models\CajaModel;
use App\Models\CitaModel;
use App\Models\PacienteModel;
use App\Core\Base\BaseController;
use App\Services\CitaService;

class CitaController extends BaseController
{
    private CitaModel     $citas;
    private PacienteModel $pacientes;
    private AtencionModel $atenciones;
    private CajaModel     $caja;
    private CitaService   $citaService;

    public function __construct()
    {
        $this->citas      = new CitaModel();
        $this->pacientes  = new PacienteModel();
        $this->atenciones = new AtencionModel();
        $this->caja       = new CajaModel();
        $this->citaService = new CitaService();
    }

    /** GET /api/citas?fecha=YYYY-MM-DD */
    public function index(Request $request): void
    {
        $cargo = (int) (Auth::user()['cargo'] ?? 0);
        $fecha = $request->get('fecha', date('Y-m-d'));
        $filas = $this->citas->listarPorFecha($fecha);

        $data = array_map(function ($fila) use ($cargo) {
            $idcita   = (int) $fila['idcita'];
            $atencion = $this->atenciones->findPorCita($idcita);

            $motivosConsulta = [
                'CONSULTA MÉDICA', 'CITA DE CONTROL', 'CONSULTA MÉDICA GASTROENTEROLOGIA ',
                'CONSULTA 0', 'CONSULTA GASTROENTEROLOGIA CON DESCUENTO',
                'CONSULTA - RESULTADO DE TEST DE ALIENTO', 'LECTURA DE TEST DE ALIENTO',
                'CONSULTA  NUTRICIONISTA', 'CONSULTA MEDICA ESPECIALIZADA (otras)',
                'CONSULTA O INTERCONSULTA PENDIENTE DE PAGO (CLINICAS)', 'CONSULTA LAB SALUD',
            ];

            $row = [
                'idcita'    => $idcita,
                'horario'   => $fila['horario'],
                'paciente'  => $fila['paciente'],
                'dni'       => $fila['dni'],
                'motivo'    => $fila['motivo'],
                'telefono'  => $fila['telefono'],
                'estado'    => $fila['estado'],
                'atencion'  => null,
                'puede_anular' => $cargo === 1,
            ];

            if ($atencion !== null) {
                $row['atencion'] = [
                    'idatencion' => (int) $atencion['idatencion'],
                    'estado'     => $atencion['estado'],
                    'es_consulta' => in_array($fila['motivo'], $motivosConsulta),
                ];
            }

            return $row;
        }, $filas);

        $this->json($data);
    }

    /** GET /api/citas/{id} */
    public function show(Request $request): void
    {
        $idcita = (int) ($request->param('id') ?? $request->get('id', 0));
        $cita   = $this->citas->find($idcita);

       if ($cita === null) {
            $this->json([], false, 'Cita no encontrada', 404);
        return;
        }
        $this->json($cita);
    }

    /** POST /api/citas */
    public function store(Request $request): void
    {
        $body = $request->json();
        $dni  = $body['dni'] ?? '';

        if ($this->pacientes->findByDni($dni) === null) {
            $this->pacientes->registrar([
                'dni'       => $dni,
                'nombre'    => $body['nombre'] ?? '',
                'apellidos' => $body['apellidos'] ?? '',
                'telefono'  => $body['telefono'] ?? '',
                'fecha_nac' => $body['fecha_nac'] ?? '',
            ]);
        }

        $idcita = $this->citas->registrar([
            'dni'             => $dni,
            'fecha'           => $body['fecha'] ?? '',
            'horario'         => $body['horario'] ?? '',
            'motivo_consulta' => $body['idtipoatencion'] ?? '',
            'precio_consulta' => $body['precio'] ?? '',
            'estado'          => 'POR PAGAR',
        ]);

        $this->json(['idcita' => $idcita]);
    }

    /** PUT /api/citas/{id} */
    public function update(Request $request): void
    {
        $body = $request->json();
        $dni  = $body['dni'] ?? '';

        if ($this->pacientes->findByDni($dni) === null) {
            $this->pacientes->registrar([
                'dni'       => $dni,
                'nombre'    => $body['nombre'] ?? '',
                'apellidos' => $body['apellidos'] ?? '',
                'telefono'  => $body['telefono'] ?? '',
                'fecha_nac' => $body['fecha_nac'] ?? '',
            ]);
        }

        $this->citas->actualizar([
            'idcita'          => (int) ($request->param('id') ?? 0),
            'dni'             => $dni,
            'fecha'           => $body['fecha'] ?? '',
            'horario'         => $body['horario'] ?? '',
            'motivo_consulta' => $body['idtipoatencion'] ?? '',
            'precio_consulta' => $body['precio'] ?? '',
        ]);

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
        $filas = $this->citas->listarPorPaciente($dni);

        $data = array_map(function ($fila) {
            $idcita   = (int) $fila['idcita'];
            $atencion = $this->atenciones->findPorCita($idcita);

            return [
                'idcita'    => $idcita,
                'fecha'     => $fila['fecha'],
                'horario'   => $fila['horario'],
                'motivo'    => $fila['motivo'],
                'estado'    => $fila['estado'],
                'atencion_estado' => $atencion ? $atencion['estado'] : null,
            ];
        }, $filas);

        $this->json($data);
    }

    /** GET /api/citas/confirmadas */
    public function confirmadas(Request $request): void
    {
        $fecha   = date('Y/m/d');
        $cargo   = (int) (Auth::user()['cargo'] ?? 0);
        $filas   = $this->citas->listarConfirmadasHoy($fecha);

        $motivosConsulta = [
            'CONSULTA MÉDICA', 'CITA DE CONTROL', 'CONSULTA MÉDICA GASTROENTEROLOGIA ',
            'CONSULTA 0', 'CONSULTA GASTROENTEROLOGIA CON DESCUENTO',
            'CONSULTA - RESULTADO DE TEST DE ALIENTO', 'LECTURA DE TEST DE ALIENTO',
            'CONSULTA  NUTRICIONISTA', 'CONSULTA MEDICA ESPECIALIZADA (otras)',
            'CONSULTA O INTERCONSULTA PENDIENTE DE PAGO (CLINICAS)', 'CONSULTA LAB SALUD',
        ];

        $data = [];
        foreach ($filas as $fila) {
            $idcita   = (int) $fila['idcita'];
            $atencion = $this->atenciones->findPorCita($idcita);

            if ($atencion === null || $atencion['estado'] === 'FINALIZADO') continue;

            $pendientes = $this->citas->buscarPendientesPorPaciente($fila['dni']);

            $data[] = [
                'idcita'      => $idcita,
                'idatencion'  => (int) $atencion['idatencion'],
                'horario'     => $fila['horario'],
                'paciente'    => $fila['paciente'],
                'motivo'      => $fila['motivo'],
                'tiene_pendientes' => !empty($pendientes),
                'es_consulta' => in_array($fila['motivo'], $motivosConsulta),
                'atencion_estado' => $atencion['estado'],
                'cargo'       => $cargo,
            ];
        }

        $this->json($data);
    }

    /** GET /api/citas/pendientes */
    public function pendientes(Request $request): void
    {
        $filas = $this->citas->listarPendientes();

        $data = array_map(fn($f) => [
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
        $body = $request->json();
        $this->citas->registrarCitaExterna([
            'paciente'       => ($body['dni'] ?? '') . ' - ' . ($body['nombre'] ?? ''),
            'idhospital'     => $body['idhospital'] ?? '',
            'idtipoatencion' => $body['idtipoatencion'] ?? '',
            'precio'         => $body['precio'] ?? '',
            'fecha'          => $body['fecha'] ?? '',
            'hora'           => $body['hora'] ?? '',
            'estado'         => 'PENDIENTE',
        ]);
    $this->json(['message' => 'Cita externa registrada correctamente']);
    }

    /** GET /api/citas/externas?fecha1=&fecha2=&establecimiento= */
    public function externasIndex(Request $request): void
    {
        $fecha1        = $request->get('fecha1', '');
        $fecha2        = $request->get('fecha2', '');
        $establecimiento = $request->get('establecimiento', '');

        $filas = ($establecimiento === '' || $establecimiento === '0')
            ? $this->citas->listarCitasExternas($fecha1, $fecha2)
            : $this->citas->filtrarCitasExternas(compact('fecha1', 'fecha2', 'establecimiento'));

        $data = array_map(fn($f) => [
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
        $id = (int) $request->param('id');
        $this->citas->anularCitaExterna($id);
        $this->json(['message' => 'Cita externa anulada']);
    }

    /** GET /api/citas/reporte-atenciones?fecha1=&fecha2=&tipoAtencion= */
   public function cantidadAtenciones(Request $request): void
    {
        $fecha1       = $request->get('fecha1', '');
        $fecha2       = $request->get('fecha2', '');
        $tipoAtencion = $request->get('tipoAtencion', '');

        $filas = ($tipoAtencion === '' || $tipoAtencion === '0')
            ? $this->citas->listarTipoAtencionesPorFecha($fecha1, $fecha2)
            : $this->citas->filtrarTipoAtenciones(compact('fecha1', 'fecha2', 'tipoAtencion'));

        $data = array_map(fn($f) => [
            'tipo_atencion' => $f['tipo_atencion'],
            'cantidad'      => (int) $f['cantidad'],
        ], $filas);

        $this->json($data);
    }
}
