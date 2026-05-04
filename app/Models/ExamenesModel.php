<?php

namespace App\Models;

use App\Core\Database;

class ExamenesModel
{
    private Database $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    public function listarPorPaciente(string $idpaciente): array
    {
        return $this->db->query(
            'SELECT * FROM examenes WHERE dni = :idpaciente ORDER BY fecha DESC',
            [':idpaciente' => $idpaciente]
        )->fetchAll() ?: [];
    }

    public function obtenerPorId(int $idexamen): ?array
    {
        $row = $this->db->query(
            'SELECT * FROM examenes WHERE idexamen = :idexamen',
            [':idexamen' => $idexamen]
        )->fetch() ?: [];

        return $row ?: null;
    }

    public function obtenerDetalle(int $idexamen): array
    {
        return $this->db->query(
            'SELECT * FROM detalle_examenes WHERE idexamen = :idexamen',
            [':idexamen' => $idexamen]
        )->fetchAll() ?: [];
    }

    public function registrar(array $examen): int
    {
        $this->db->query(
            'INSERT INTO examenes(dni, nombre, fecha, tipoexamen)
             VALUES (:dni, :nombre, :fecha, :tipoexamen)',
            [
                ':dni' => $examen['dni'],
                ':nombre' => $examen['nombre'],
                ':fecha' => $examen['fecha'],
                ':tipoexamen' => $examen['tipoexamen'],
            ]
        );
        return (int) $this->db->lastInsertId();
    }

    public function registrarDetalle(array $detalle): bool
    {
        $stmt = $this->db->query(
            'INSERT INTO detalle_examenes(idexamen, archivo) VALUES (:idexamen, :archivo)',
            [':idexamen' => $detalle['idexamen'], ':archivo' => $detalle['archivo']]
        );
        return $stmt->rowCount() > 0;
    }

    public function eliminarDetalle(int $idexamen): bool
    {
        $stmt = $this->db->query(
            'DELETE FROM detalle_examenes WHERE idexamen = :idexamen',
            [':idexamen' => $idexamen]
        );
        return $stmt->rowCount() >= 0;
    }

    public function eliminar(int $idexamen): bool
    {
        $stmt = $this->db->query(
            'DELETE FROM examenes WHERE idexamen = :idexamen',
            [':idexamen' => $idexamen]
        );
        return $stmt->rowCount() > 0;
    }
}
