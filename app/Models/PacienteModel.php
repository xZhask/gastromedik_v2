<?php

namespace App\Models;

use App\Core\Database;

class PacienteModel
{
    private Database $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    /** Devuelve hasta 15 pacientes (listado inicial) */
    public function listar(): array
    {
        return $this->db->query('SELECT * FROM paciente LIMIT 15')->fetchAll() ?: [];
    }

    /** Busca pacientes por nombre o apellidos (búsqueda LIKE) */
    public function buscar(string $filtro): array
    {
        return $this->db->query(
            "SELECT * FROM paciente WHERE concat_ws(', ', apellidos, nombre) LIKE :filtro",
            [':filtro' => '%' . $filtro . '%']
        )->fetchAll() ?: [];
    }

    /** Obtiene un paciente por DNI. Devuelve null si no existe. */
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
                ':dni'       => $paciente['dni'],
                ':nombre'    => $paciente['nombre'],
                ':apellidos' => $paciente['apellidos'],
                ':telefono'  => $paciente['telefono'],
                ':fecha_nac' => $paciente['fecha_nac'],
            ]
        );
        return $stmt->rowCount() > 0;
    }

    public function actualizar(array $paciente): bool
    {
        $stmt = $this->db->query(
            'UPDATE paciente
                SET nombre    = :nombre,
                    apellidos = :apellidos,
                    telefono  = :telefono,
                    fecha_nac = :fecha_nac
              WHERE dni = :dni',
            [
                ':dni'       => $paciente['dni'],
                ':nombre'    => $paciente['nombre'],
                ':apellidos' => $paciente['apellidos'],
                ':telefono'  => $paciente['telefono'],
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
