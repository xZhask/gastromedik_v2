<?php

namespace App\Models;

use App\Core\Base\BaseModel;

class MedicamentoModel extends BaseModel
{
    public function buscar(string $term): array
    {
        $sql = "SELECT idmedicina, nombre, stock, tipoinsumo
                FROM medicamento
                WHERE nombre LIKE :term
                ORDER BY nombre ASC
                LIMIT 20";

        return $this->fetchAll($this->db->query($sql, [':term' => "%{$term}%"]));
    }

    public function obtenerPorId(int $id): ?array
    {
        $sql = "SELECT idmedicina, nombre, stock, tipoinsumo
                FROM medicamento
                WHERE idmedicina = :id";

        return $this->fetch($this->db->query($sql, [':id' => $id]));
    }

    public function listar(): array
    {
        $sql = "SELECT idmedicina, nombre, stock, tipoinsumo
                FROM medicamento
                ORDER BY tipoinsumo ASC, nombre ASC";

        return $this->fetchAll($this->db->query($sql));
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

    public function actualizar(int $id, array $data)
    {
        $sql = "UPDATE medicamento SET
                    nombre = :nombre,
                    stock = :stock,
                    tipoinsumo = :tipoinsumo
                WHERE idmedicina = :id";

        return $this->db->query($sql, [
            ':id' => $id,
            ':nombre' => trim((string) ($data['nombre'] ?? '')),
            ':stock' => (int) ($data['stock'] ?? 0),
            ':tipoinsumo' => trim((string) ($data['tipoinsumo'] ?? 'MEDICAM')),
        ]);
    }

    public function ajustarStock(int $id, int $cantidad, string $tipo)
    {
        $operador = strtoupper($tipo) === 'S' ? '-' : '+';
        $sql = "UPDATE medicamento SET stock = stock {$operador} :cantidad WHERE idmedicina = :id";

        return $this->db->query($sql, [
            ':cantidad' => $cantidad,
            ':id' => $id,
        ]);
    }

    public function registrarMovimiento(int $idProducto, int $cantidad, string $tipo, string $descripcion, string $usuario)
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

        return $this->db->query($sql, [
            ':tipomovimiento' => strtoupper($tipo),
            ':idproducto' => $idProducto,
            ':cantidad' => $cantidad,
            ':descripcion' => trim($descripcion),
            ':usuario' => trim($usuario),
        ]);
    }
}
