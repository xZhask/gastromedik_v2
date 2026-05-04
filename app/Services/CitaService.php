<?php

namespace App\Services;

use App\Core\Database;
use App\Core\Logger;
use App\Core\ValidationException;
use App\Core\Validator;
use App\Models\AtencionModel;
use App\Models\CajaModel;
use App\Models\CitaModel;
use App\Models\PacienteModel;
use RuntimeException;
use Throwable;

class CitaService
{
    private Database $db;
    private CajaModel $caja;
    private CitaModel $citas;
    private AtencionModel $atenciones;
    private PacienteModel $pacientes;

    public function __construct()
    {
        $this->db         = Database::getInstance();
        $this->caja       = new CajaModel();
        $this->citas      = new CitaModel();
        $this->atenciones = new AtencionModel();
        $this->pacientes  = new PacienteModel();
    }

    // ── Consultas ─────────────────────────────────────────────────────────────

    /** Lista citas de una fecha enriquecidas con su atención asociada */
    public function listarPorFecha(string $fecha): array
    {
        $filas = $this->citas->listarPorFecha($fecha);
        return array_map(function (array $fila): array {
            $fila['atencion'] = $this->atenciones->findPorCita((int) $fila['idcita']);
            return $fila;
        }, $filas);
    }

    public function find(int $idcita): ?array
    {
        return $this->citas->find($idcita);
    }

    /** Lista las últimas 10 citas de un paciente con estado de su atención */
    public function listarPorPaciente(string $dni): array
    {
        $filas = $this->citas->listarPorPaciente($dni);
        return array_map(function (array $fila): array {
            $atencion = $this->atenciones->findPorCita((int) $fila['idcita']);
            $fila['atencion_estado'] = $atencion ? $atencion['estado'] : null;
            return $fila;
        }, $filas);
    }

    /**
     * Citas confirmadas (PAGADO / A CUENTA) del día con atención activa.
     * Excluye atenciones FINALIZADO.
     */
    public function listarConfirmadas(string $fecha): array
    {
        $filas  = $this->citas->listarConfirmadasHoy($fecha);
        $result = [];
        foreach ($filas as $fila) {
            $idcita   = (int) $fila['idcita'];
            $atencion = $this->atenciones->findPorCita($idcita);
            if ($atencion === null || $atencion['estado'] === 'FINALIZADO') {
                continue;
            }
            $fila['atencion']         = $atencion;
            $fila['tiene_pendientes'] = !empty($this->citas->buscarPendientesPorPaciente($fila['dni']));
            $result[]                 = $fila;
        }
        return $result;
    }

    /** Citas pendientes de pago del último año */
    public function listarPendientes(): array
    {
        return $this->citas->listarPendientes();
    }

    /** Citas externas filtradas por rango de fecha y opcionalmente por establecimiento */
    public function listarExternas(string $fecha1, string $fecha2, string $establecimiento = ''): array
    {
        if ($establecimiento === '' || $establecimiento === '0') {
            return $this->citas->listarCitasExternas($fecha1, $fecha2);
        }
        return $this->citas->filtrarCitasExternas(compact('fecha1', 'fecha2', 'establecimiento'));
    }

    /** Conteo de atenciones por tipo, con filtro opcional de tipo */
    public function contarPorTipoAtencion(string $fecha1, string $fecha2, string $tipoAtencion = ''): array
    {
        if ($tipoAtencion === '' || $tipoAtencion === '0') {
            return $this->citas->listarTipoAtencionesPorFecha($fecha1, $fecha2);
        }
        return $this->citas->filtrarTipoAtenciones(compact('fecha1', 'fecha2', 'tipoAtencion'));
    }

    // ── Escritura ─────────────────────────────────────────────────────────────

    /**
     * Registra un paciente (si no existe) y crea la cita.
     * Retorna el id de la nueva cita.
     */
    public function registrar(array $body): int
    {
        $v = Validator::make($body, [
            'dni'            => 'required|numeric|length:8',
            'nombre'         => 'required|min:2|max:100',
            'apellidos'      => 'required|min:2|max:100',
            'fecha'          => 'required|date',
            'horario'        => 'required',
            'idtipoatencion' => 'required',
            'precio'         => 'required|numeric',
        ]);
        if ($v->fails()) {
            throw new ValidationException($v->errors());
        }

        $dni = $body['dni'];
        if ($this->pacientes->findByDni($dni) === null) {
            $this->pacientes->registrar([
                'dni'       => $dni,
                'nombre'    => $body['nombre'],
                'apellidos' => $body['apellidos'],
                'telefono'  => $body['telefono'] ?? '',
                'fecha_nac' => $body['fecha_nac'] ?? '',
            ]);
        }

        $idcita = $this->citas->registrar([
            'dni'             => $dni,
            'fecha'           => $body['fecha'],
            'horario'         => $body['horario'],
            'motivo_consulta' => $body['idtipoatencion'],
            'precio_consulta' => $body['precio'],
            'estado'          => 'POR PAGAR',
        ]);

        Logger::info('Cita registrada', ['idcita' => $idcita, 'dni' => $dni]);
        return $idcita;
    }

    /**
     * Actualiza paciente (si no existe lo registra) y los datos de la cita.
     */
    public function actualizar(int $idcita, array $body): void
    {
        $v = Validator::make($body, [
            'dni'            => 'required|numeric|length:8',
            'nombre'         => 'required|min:2|max:100',
            'apellidos'      => 'required|min:2|max:100',
            'fecha'          => 'required|date',
            'horario'        => 'required',
            'idtipoatencion' => 'required',
            'precio'         => 'required|numeric',
        ]);
        if ($v->fails()) {
            throw new ValidationException($v->errors());
        }

        $dni = $body['dni'];
        if ($this->pacientes->findByDni($dni) === null) {
            $this->pacientes->registrar([
                'dni'       => $dni,
                'nombre'    => $body['nombre'],
                'apellidos' => $body['apellidos'],
                'telefono'  => $body['telefono'] ?? '',
                'fecha_nac' => $body['fecha_nac'] ?? '',
            ]);
        }

        $this->citas->actualizar([
            'idcita'          => $idcita,
            'dni'             => $dni,
            'fecha'           => $body['fecha'],
            'horario'         => $body['horario'],
            'motivo_consulta' => $body['idtipoatencion'],
            'precio_consulta' => $body['precio'],
        ]);

        Logger::info('Cita actualizada', ['idcita' => $idcita, 'dni' => $dni]);
    }

    /** Anula una cita en transacción: revierte ingresos de caja y cancela la atención */
    public function anular(int $idcita): void
    {
        $cita = $this->citas->find($idcita);
        if ($cita === null) {
            throw new RuntimeException('Cita no encontrada.', 404);
        }

        $this->db->beginTransaction();

        try {
            $ingresos = $this->caja->listarIngresosPorCita($idcita);
            $atencion = $this->atenciones->findPorCita($idcita);

            foreach ($ingresos as $movimiento) {
                $this->caja->anularIngreso((int) $movimiento['idmovimientocaja']);
            }

            if ($atencion !== null) {
                $this->atenciones->cancelar((int) $atencion['idatencion']);
            }

            $this->citas->anular($idcita);

            $this->db->commit();
            Logger::info('Cita anulada', ['idcita' => $idcita]);
        } catch (Throwable $e) {
            $this->db->rollBack();
            Logger::error('Error al anular cita', ['idcita' => $idcita, 'error' => $e->getMessage()]);
            throw $e;
        }
    }

    public function registrarExterna(array $body): void
    {
        $v = Validator::make($body, [
            'dni'            => 'required|numeric|length:8',
            'nombre'         => 'required|min:2|max:100',
            'idhospital'     => 'required|integer',
            'idtipoatencion' => 'required|integer',
            'precio'         => 'required|numeric',
            'fecha'          => 'required|date',
            'hora'           => 'required',
        ]);
        if ($v->fails()) {
            throw new ValidationException($v->errors());
        }

        $this->citas->registrarCitaExterna([
            'paciente'       => $body['dni'] . ' - ' . $body['nombre'],
            'idhospital'     => $body['idhospital'],
            'idtipoatencion' => $body['idtipoatencion'],
            'precio'         => $body['precio'],
            'fecha'          => $body['fecha'],
            'hora'           => $body['hora'],
            'estado'         => 'PENDIENTE',
        ]);

        Logger::info('Cita externa registrada', ['dni' => $body['dni']]);
    }

    public function anularExterna(int $id): void
    {
        $this->citas->anularCitaExterna($id);
        Logger::info('Cita externa anulada', ['id' => $id]);
    }
}
