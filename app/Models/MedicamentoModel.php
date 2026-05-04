<?php

namespace App\Models;

use App\Core\Database;

class MedicamentoModel
{
    private Database $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    public function buscar(string $term): array
    {
        $sql = "SELECT idmedicina, nombre, stock, tipoinsumo
                FROM medicamento
                WHERE nombre LIKE :term
                ORDER BY nombre ASC
                LIMIT 20";

        return $this->db->query($sql, [':term' => "%{$term}%"])->fetchAll() ?: [];
    }

    public function listar(?string $q = null): array
    {
        if ($q !== null && trim($q) !== '') {
            return $this->db->query(
                'SELECT idmedicina, nombre, stock, tipoinsumo
                   FROM medicamento
                  WHERE nombre LIKE :q
                  ORDER BY nombre ASC',
                [':q' => '%' . trim($q) . '%']
            )->fetchAll() ?: [];
        }

        return $this->db->query(
            'SELECT idmedicina, nombre, stock, tipoinsumo
               FROM medicamento
              ORDER BY nombre ASC'
        )->fetchAll() ?: [];
    }

    public function obtenerPorId(int $id): ?array
    {
        $sql = "SELECT idmedicina, nombre, stock, tipoinsumo
                FROM medicamento
                WHERE idmedicina = :id";

        $row = $this->db->query($sql, [':id' => $id])->fetch() ?: [];
        return $row ?: null;
    }

    public function findByNombre(string $nombre): ?array
    {
        $row = $this->db->query(
            'SELECT idmedicina, nombre, stock, tipoinsumo
               FROM medicamento
              WHERE UPPER(nombre) = UPPER(:nombre)
              LIMIT 1',
            [':nombre' => $nombre]
        )->fetch() ?: [];

        return $row ?: null;
    }

    public function crear(array $data): string
    {
        $sql = "INSERT INTO medicamento (nombre, stock, tipoinsumo)
                VALUES (:nombre, :stock, :tipoinsumo)";

        $this->db->query($sql, [
            ':nombre' => trim((string) ($data['nombre'] ?? '')),
            ':stock' => (int) ($data['stock'] ?? 0),
            ':tipoinsumo' => trim((string) ($data['tipoinsumo'] ?? 'MEDICAM')),
        ]);

        return $this->db->lastInsertId();
    }

    public function actualizar(int $id, array $data): bool
    {
        $sql = "UPDATE medicamento SET
                    nombre = :nombre,
                    stock = :stock,
                    tipoinsumo = :tipoinsumo
                WHERE idmedicina = :id";

        $stmt = $this->db->query($sql, [
            ':id' => $id,
            ':nombre' => trim((string) ($data['nombre'] ?? '')),
            ':stock' => (int) ($data['stock'] ?? 0),
            ':tipoinsumo' => trim((string) ($data['tipoinsumo'] ?? 'MEDICAM')),
        ]);

        return $stmt->rowCount() >= 0;
    }

    public function ajustarStock(int $id, int $cantidad, string $tipo): bool
    {
        $operador = strtoupper($tipo) === 'S' ? '-' : '+';
        $sql = "UPDATE medicamento SET stock = stock {$operador} :cantidad WHERE idmedicina = :id";

        $stmt = $this->db->query($sql, [
            ':cantidad' => $cantidad,
            ':id' => $id,
        ]);

        return $stmt->rowCount() > 0;
    }

    public function registrarMovimiento(int $idProducto, int $cantidad, string $tipo, string $descripcion, string $usuario): bool
    {
        $sql = "INSERT INTO movimientoalmacen (
                    tipomovimiento,
                    idproducto,
                    cantidad,
                    descripcion,
                    fecha,
                    usuario
                ) VALUES (
                    :tipomovimiento,
                    :idproducto,
                    :cantidad,
                    :descripcion,
                    NOW(),
                    :usuario
                )";

        $stmt = $this->db->query($sql, [
            ':tipomovimiento' => strtoupper($tipo),
            ':idproducto' => $idProducto,
            ':cantidad' => $cantidad,
            ':descripcion' => trim($descripcion),
            ':usuario' => trim($usuario),
        ]);

        return $stmt->rowCount() > 0;
    }

    public function contarMovimientos(int $id): int
    {
        $row = $this->db->query(
            'SELECT COUNT(*) AS total FROM movimientoalmacen WHERE idproducto = :id',
            [':id' => $id]
        )->fetch() ?: [];

        return (int) ($row['total'] ?? 0);
    }

    public function contarTratamientos(int $id): int
    {
        $row = $this->db->query(
            'SELECT COUNT(*) AS total FROM tratamiento WHERE idmedicina = :id',
            [':id' => $id]
        )->fetch() ?: [];

        return (int) ($row['total'] ?? 0);
    }

    public function eliminar(int $id): bool
    {
        $stmt = $this->db->query('DELETE FROM medicamento WHERE idmedicina = :id', [':id' => $id]);
        return $stmt->rowCount() > 0;
    }
}
