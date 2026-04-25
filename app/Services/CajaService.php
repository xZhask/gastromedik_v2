<?php

namespace App\Services;

use App\Core\Database;
use App\Models\AtencionModel;
use App\Models\CajaModel;
use App\Models\CitaModel;
use RuntimeException;
use Throwable;

class CajaService
{
    private Database $db;
    private CajaModel $caja;
    private CitaModel $citas;
    private AtencionModel $atenciones;

    public function __construct()
    {
        $this->db = Database::getInstance();
        $this->caja = new CajaModel();
        $this->citas = new CitaModel();
        $this->atenciones = new AtencionModel();
    }

    public function registrarPago(array $body, ?string $idusuario): array
    {
        $idcita = (int) ($body['idcita'] ?? 0);
        $montoPagado = (float) ($body['monto_pagado'] ?? 0);

        if ($idcita <= 0) {
            throw new RuntimeException('La cita es obligatoria.', 422);
        }

        if ($montoPagado <= 0) {
            throw new RuntimeException('El monto a pagar debe ser mayor que cero.', 422);
        }

        $cita = $this->citas->find($idcita);
        if ($cita === null) {
            throw new RuntimeException('Cita no encontrada.', 404);
        }

        $cajaDiaria = $this->caja->findCajaActiva();
        if ($cajaDiaria === null) {
            throw new RuntimeException('No hay una caja abierta para registrar el pago.', 409);
        }

        $fecha = date('Y/m/d H:i:s');
        $this->db->beginTransaction();

        try {
            $idmovimiento = $this->caja->insertarMovimientoYObtenerId([
                'idtipopago'         => $body['idtipopago'] ?? 1,
                'idcajadiaria'       => $cajaDiaria['idcajadiaria'],
                'tipomovimientocaja' => 'INGRESO',
                'descripcion'        => 'PAGO POR ' . ($body['motivo'] ?? $cita['motivo'] ?? 'ATENCION'),
                'monto'              => $montoPagado,
                'codigoreferencia'   => $idcita,
                'fecha'              => $fecha,
                'idusuario'          => $idusuario,
            ]);

            $totalPagado = $this->caja->sumarIngresosPorCita($idcita);
            $estadoCita = $this->resolverEstadoCita((float) $cita['precio_consulta'], $totalPagado);
            $this->citas->actualizarEstado($idcita, $estadoCita);

            $atencion = $this->atenciones->findPorCita($idcita);
            if ($atencion === null) {
                $this->atenciones->registrar([
                    'idpaciente'     => $cita['dni'],
                    'idtipoatencion' => $cita['idtipoatencion'],
                    'idmovimiento'   => $idmovimiento,
                    'idusuario'      => $idusuario,
                    'fechaatencion'  => null,
                    'motivoconsulta' => '-',
                    'antecedente'    => '-',
                    'anamensis'      => '-',
                    'exfisico'       => '-',
                    'diagnostico'    => '-',
                    'tratamiento'    => '-',
                    'examen'         => '-',
                    'estado'         => 'INICIADO',
                ]);

                $atencion = $this->atenciones->findPorMovimiento($idmovimiento);
            }

            $this->db->commit();

            return [
                'idcita' => $idcita,
                'estado' => $estadoCita,
                'idmovimiento' => $idmovimiento,
                'idatencion' => (int) ($atencion['idatencion'] ?? 0),
                'total_pagado' => $totalPagado,
            ];
        } catch (Throwable $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    private function resolverEstadoCita(float $precioTotal, float $totalPagado): string
    {
        if ($totalPagado <= 0) {
            return 'POR PAGAR';
        }

        if ($totalPagado + 0.00001 < $precioTotal) {
            return 'A CUENTA';
        }

        return 'PAGADO';
    }
}
