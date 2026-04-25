<?php

namespace App\Models;

use App\Core\Database;

/**
 * Consultas de reportes y datos transversales (no encajan en un solo dominio).
 */
class ConsultasModel
{
    private Database $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    public function listarTiposPago(): array
    {
        return $this->db->query('SELECT * FROM tipo_pago')->fetchAll() ?: [];
    }

    /**
     * Reporte de movimientos de caja por tipo y rango de fechas.
     * Incluye los movimientos anulados (A-INGRESO, A-GASTO, etc.)
     */
    public function reporteCantidades(array $filtro): array
    {
        return $this->db->query(
            'SELECT mc.*,
                    tp.tipopago,
                    u.nick
               FROM movimientocaja mc
               INNER JOIN usuario   u  ON mc.idusuario  = u.dni
               INNER JOIN tipo_pago tp ON tp.idtipopago = mc.idtipopago
              WHERE (mc.tipomovimientocaja = :tipo OR mc.tipomovimientocaja = CONCAT("A-", :tipo2))
                AND mc.fecha >= :fecha1
                AND mc.fecha <= :fecha2',
            [
                ':tipo'   => $filtro['tipomovimientocaja'],
                ':tipo2'  => $filtro['tipomovimientocaja'],
                ':fecha1' => $filtro['fecha1'],
                ':fecha2' => $filtro['fecha2'],
            ]
        )->fetchAll() ?: [];
    }

    /** Kardex de movimientos de almacén de un producto en un rango de fechas */
    public function kardex(array $datos): array
    {
        return $this->db->query(
            'SELECT ma.fecha,
                    ma.descripcion,
                    ma.cantidad,
                    ma.tipomovimiento,
                    u.nick
               FROM movimientoalmacen ma
               INNER JOIN usuario u ON ma.usuario = u.dni
              WHERE ma.idproducto = :idproducto
                AND ma.fecha >  :fecha1
                AND ma.fecha <= :fecha2
              ORDER BY ma.fecha',
            [
                ':idproducto' => $datos['idproducto'],
                ':fecha1'     => $datos['fecha1'],
                ':fecha2'     => $datos['fecha2'],
            ]
        )->fetchAll() ?: [];
    }

    /** Cantidad acumulada de un tipo de movimiento de almacén antes de una fecha */
    public function cantidadKardexAnterior(array $datos, string $tipomov): float
    {
        $row = $this->db->query(
            'SELECT SUM(cantidad) AS tipokardex
               FROM movimientoalmacen
              WHERE idproducto    = :idproducto
                AND tipomovimiento = :tipomov
                AND fecha          < :fecha1',
            [
                ':idproducto' => $datos['idproducto'],
                ':fecha1'     => $datos['fecha1'],
                ':tipomov'    => $tipomov,
            ]
        )->fetch() ?: [];

        return (float) ($row['tipokardex'] ?? 0);
    }
}
