<?php

namespace App\Models;

use App\Core\Database;

class CajaModel
{
    private Database $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    /** Obtiene la caja activa actual. Devuelve null si no hay caja abierta. */
    public function findCajaActiva(): ?array
    {
        $row = $this->db->query(
            'SELECT * FROM cajadiaria WHERE estado = "ACTIVO" ORDER BY idcajadiaria DESC LIMIT 1'
        )->fetch() ?: [];

        return $row ?: null;
    }

    public function ultimoIdMovimiento(): int
    {
        $row = $this->db->query(
            'SELECT MAX(idmovimientocaja) AS idmovimientocaja FROM movimientocaja'
        )->fetch() ?: [];

        return (int) ($row['idmovimientocaja'] ?? 0);
    }

    public function aperturar(array $caja): bool
    {
        $stmt = $this->db->query(
            'INSERT INTO cajadiaria(idcajadiaria, fecha_apertura, fecha_cierre, monto_apertura, monto_cierre, estado)
             VALUES (NULL, :fecha_apertura, NULL, :monto_apertura, :monto_cierre, "ACTIVO")',
            [
                ':fecha_apertura' => $caja['fecha_apertura'],
                ':monto_apertura' => $caja['monto_apertura'],
                ':monto_cierre'   => $caja['monto_cierre'],
            ]
        );
        return $stmt->rowCount() > 0;
    }

    public function cerrar(array $caja): bool
    {
        $stmt = $this->db->query(
            'UPDATE cajadiaria
                SET fecha_cierre = :fecha_cierre,
                    monto_cierre = :monto_cierre,
                    estado       = "FINALIZADO"
              WHERE idcajadiaria = :idcajadiaria',
            [
                ':idcajadiaria' => $caja['idcajadiaria'],
                ':fecha_cierre' => $caja['fecha_cierre'],
                ':monto_cierre' => $caja['monto_cierre'],
            ]
        );
        return $stmt->rowCount() > 0;
    }

    public function insertarMovimiento(array $movimiento): bool
    {
        $stmt = $this->db->query(
            'INSERT INTO movimientocaja(
                idtipopago, idcajadiaria, tipomovimientocaja, descripcion,
                monto, codigoreferencia, fecha, idusuario
             ) VALUES (
                :idtipopago, :idcajadiaria, :tipomovimientocaja, :descripcion,
                :monto, :codigoreferencia, :fecha, :idusuario
             )',
            [
                ':idtipopago'          => $movimiento['idtipopago'],
                ':idcajadiaria'        => $movimiento['idcajadiaria'],
                ':tipomovimientocaja'  => $movimiento['tipomovimientocaja'],
                ':descripcion'         => $movimiento['descripcion'],
                ':monto'               => $movimiento['monto'],
                ':codigoreferencia'    => $movimiento['codigoreferencia'],
                ':fecha'               => $movimiento['fecha'],
                ':idusuario'           => $movimiento['idusuario'],
            ]
        );
        return $stmt->rowCount() > 0;
    }

    public function insertarMovimientoYObtenerId(array $movimiento): int
    {
        $this->insertarMovimiento($movimiento);
        return (int) $this->db->lastInsertId();
    }

    public function anularIngreso(int $idmovimiento): bool
    {
        $stmt = $this->db->query(
            'UPDATE movimientocaja SET tipomovimientocaja = "A-INGRESO" WHERE idmovimientocaja = :id',
            [':id' => $idmovimiento]
        );
        return $stmt->rowCount() > 0;
    }

    public function listarGastos(int $idcajadiaria): array
    {
        return $this->db->query(
            'SELECT mc.idmovimientocaja,
                    mc.descripcion,
                    mc.fecha,
                    mc.monto,
                    u.nick
               FROM movimientocaja mc
               INNER JOIN usuario u ON u.dni = mc.idusuario
              WHERE mc.idcajadiaria = :idcajadiaria
                AND mc.tipomovimientocaja = "GASTO"',
            [':idcajadiaria' => $idcajadiaria]
        )->fetchAll() ?: [];
    }

    public function listarUltimosIngresos(int $idcajadiaria): array
    {
        return $this->db->query(
            'SELECT mc.idmovimientocaja,
                    mc.descripcion,
                    mc.fecha,
                    mc.monto,
                    u.nick,
                    tp.tipopago
               FROM movimientocaja mc
               INNER JOIN usuario   u  ON u.dni = mc.idusuario
               INNER JOIN tipo_pago tp ON tp.idtipopago = mc.idtipopago
              WHERE mc.idcajadiaria = :idcajadiaria
                AND mc.tipomovimientocaja = "INGRESO"
              ORDER BY mc.fecha DESC',
            [':idcajadiaria' => $idcajadiaria]
        )->fetchAll() ?: [];
    }

    /** Suma de montos en efectivo (idtipopago = 1) de un tipo de movimiento */
    public function calcularEfectivo(int $idcajadiaria, string $tipoMovimiento): float
    {
        $row = $this->db->query(
            'SELECT SUM(monto) AS suma
               FROM movimientocaja
              WHERE idcajadiaria       = :idcajadiaria
                AND tipomovimientocaja = :tipo
                AND idtipopago         = 1',
            [':idcajadiaria' => $idcajadiaria, ':tipo' => $tipoMovimiento]
        )->fetch() ?: [];

        return (float) ($row['suma'] ?? 0);
    }

    /** Suma total de montos (todos los tipos de pago) de un tipo de movimiento */
    public function calcularTotal(int $idcajadiaria, string $tipoMovimiento): float
    {
        $row = $this->db->query(
            'SELECT SUM(monto) AS suma
               FROM movimientocaja
              WHERE idcajadiaria       = :idcajadiaria
                AND tipomovimientocaja = :tipo',
            [':idcajadiaria' => $idcajadiaria, ':tipo' => $tipoMovimiento]
        )->fetch() ?: [];

        return (float) ($row['suma'] ?? 0);
    }

    /** Ingresos agrupados por tipo de pago (excluye efectivo) desde una fecha */
    public function calcularOtrosIngresos(string $fechainicio): array
    {
        return $this->db->query(
            'SELECT tp.tipopago,
                    SUM(m.monto) AS suma
               FROM tipo_pago tp
               INNER JOIN movimientocaja m ON m.idtipopago = tp.idtipopago
              WHERE m.fecha >= :fecha
                AND m.tipomovimientocaja = "INGRESO"
                AND m.idtipopago <> 1
              GROUP BY tp.tipopago',
            [':fecha' => $fechainicio]
        )->fetchAll() ?: [];
    }

    public function findMovimientoPorCita(int $idcita): ?array
    {
        $row = $this->db->query(
            'SELECT *
               FROM movimientocaja
              WHERE codigoreferencia = :idcita
              ORDER BY idmovimientocaja ASC
              LIMIT 1',
            [':idcita' => $idcita]
        )->fetch() ?: [];

        return $row ?: null;
    }

    public function listarIngresosPorCita(int $idcita): array
    {
        return $this->db->query(
            'SELECT *
               FROM movimientocaja
              WHERE codigoreferencia = :idcita
                AND tipomovimientocaja = "INGRESO"
              ORDER BY idmovimientocaja ASC',
            [':idcita' => $idcita]
        )->fetchAll() ?: [];
    }

    public function sumarIngresosPorCita(int $idcita): float
    {
        $row = $this->db->query(
            'SELECT SUM(monto) AS total
               FROM movimientocaja
              WHERE codigoreferencia = :idcita
                AND tipomovimientocaja = "INGRESO"',
            [':idcita' => $idcita]
        )->fetch() ?: [];

        return (float) ($row['total'] ?? 0);
    }

    public function buscarCajasPorFecha(string $fecha1, string $fecha2): array
    {
        return $this->db->query(
            'SELECT * FROM cajadiaria WHERE fecha_apertura >= :desde AND fecha_apertura < :hasta',
            [':desde' => $fecha1, ':hasta' => $fecha2]
        )->fetchAll() ?: [];
    }
}
