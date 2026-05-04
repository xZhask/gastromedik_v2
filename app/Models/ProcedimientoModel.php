<?php

namespace App\Models;

use App\Core\Base\BaseModel;

class ProcedimientoModel extends BaseModel
{
    public function listar(): array
    {
        return $this->db->query('SELECT * FROM tipo_atencion')->fetchAll() ?: [];
    }

    public function buscar(string $filtro): array
    {
        return $this->db->query(
            'SELECT * FROM tipo_atencion WHERE nombre LIKE :filtro',
            [':filtro' => '%' . $filtro . '%']
        )->fetchAll() ?: [];
    }

    public function find(int $id): ?array
    {
        $row = $this->db->query(
            'SELECT * FROM tipo_atencion WHERE idtipoatencion = :id',
            [':id' => $id]
        )->fetch() ?: [];

        return $row ?: null;
    }

    public function findByNombre(string $nombre): ?array
    {
        $row = $this->db->query(
            'SELECT * FROM tipo_atencion WHERE nombre = :nombre',
            [':nombre' => $nombre]
        )->fetch() ?: [];

        return $row ?: null;
    }

    public function registrar(array $proc): bool
    {
        $stmt = $this->db->query(
            'INSERT INTO tipo_atencion(nombre, precio) VALUES (:nombre, :precio)',
            [':nombre' => $proc['nombre'], ':precio' => $proc['precio']]
        );
        return $stmt->rowCount() > 0;
    }

    public function actualizar(array $proc): bool
    {
        $stmt = $this->db->query(
            'UPDATE tipo_atencion
                SET nombre = :nombre,
                    precio = :precio
              WHERE idtipoatencion = :id',
            [':id' => $proc['idtipoatencion'], ':nombre' => $proc['nombre'], ':precio' => $proc['precio']]
        );
        return $stmt->rowCount() > 0;
    }

    public function eliminar(int $id): bool
    {
        $stmt = $this->db->query(
            'DELETE FROM tipo_atencion WHERE idtipoatencion = :id',
            [':id' => $id]
        );
        return $stmt->rowCount() > 0;
    }

    /** Verifica si hay atenciones registradas con este procedimiento */
    public function tieneAtenciones(int $id): bool
    {
        $stmt = $this->db->query(
            'SELECT COUNT(*) AS total FROM atencion WHERE idtipoatencion = :id',
            [':id' => $id]
        );
        $row = $stmt->fetch() ?: [];
        return (int) ($row['total'] ?? 0) > 0;
    }
}
