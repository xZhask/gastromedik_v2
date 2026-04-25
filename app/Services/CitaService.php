<?php

namespace App\Services;

use App\Core\Database;
use App\Models\AtencionModel;
use App\Models\CajaModel;
use App\Models\CitaModel;
use RuntimeException;
use Throwable;

class CitaService
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
                $this->atenciones->actualizarEstado((int) $atencion['idatencion'], 'CANCELADO');
            }

            $this->citas->anular($idcita);

            $this->db->commit();
        } catch (Throwable $e) {
            $this->db->rollBack();
            throw $e;
        }
    }
}
