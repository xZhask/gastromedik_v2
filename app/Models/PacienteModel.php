<?php

namespace App\Models;

use App\Core\Base\BaseModel;

class PacienteModel extends BaseModel
{
    public function listar(): array
    {
        return $this->db->query(
            'SELECT * FROM paciente
             WHERE dni <> ""
             ORDER BY apellidos ASC, nombre ASC
             LIMIT 15'
        )->fetchAll() ?: [];
    }

    public function buscar(string $filtro): array
    {
        return $this->db->query(
            'SELECT *
               FROM paciente
              WHERE dni LIKE :dni
                 OR nombre LIKE :texto
                 OR apellidos LIKE :texto
                 OR concat_ws(", ", apellidos, nombre) LIKE :texto
              ORDER BY apellidos ASC, nombre ASC',
            [
                ':dni' => '%' . $filtro . '%',
                ':texto' => '%' . $filtro . '%',
            ]
        )->fetchAll() ?: [];
    }

    public function findByDni(string $dni): ?array
    {
        $row = $this->db->query(
            'SELECT * FROM paciente WHERE dni = :dni',
            [':dni' => $dni]
        )->fetch() ?: [];

        return $row ?: null;
    }

    public function registrar(array $paciente): bool
    {
        $stmt = $this->db->query(
            'INSERT INTO paciente(dni, nombre, apellidos, telefono, fecha_nac)
             VALUES (:dni, :nombre, :apellidos, :telefono, :fecha_nac)',
            [
                ':dni' => $paciente['dni'],
                ':nombre' => $paciente['nombre'],
                ':apellidos' => $paciente['apellidos'],
                ':telefono' => $paciente['telefono'],
                ':fecha_nac' => $paciente['fecha_nac'],
            ]
        );
        return $stmt->rowCount() > 0;
    }

    public function actualizar(array $paciente): bool
    {
        $stmt = $this->db->query(
            'UPDATE paciente
                SET nombre = :nombre,
                    apellidos = :apellidos,
                    telefono = :telefono,
                    fecha_nac = :fecha_nac
              WHERE dni = :dni',
            [
                ':dni' => $paciente['dni'],
                ':nombre' => $paciente['nombre'],
                ':apellidos' => $paciente['apellidos'],
                ':telefono' => $paciente['telefono'],
                ':fecha_nac' => $paciente['fecha_nac'],
            ]
        );
        return $stmt->rowCount() > 0;
    }

    public function eliminar(string $dni): bool
    {
        $stmt = $this->db->query(
            'DELETE FROM paciente WHERE dni = :dni',
            [':dni' => $dni]
        );
        return $stmt->rowCount() > 0;
    }
}
