<?php

namespace App\Models;

use App\Core\Database;

class AntecedentesModel
{
    private Database $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    public function findGeneralesByDni(string $dni): ?array
    {
        $row = $this->db->query(
            'SELECT * FROM antecedentesgenerales WHERE dni = :dni',
            [':dni' => $dni]
        )->fetch() ?: [];

        return $row ?: null;
    }

    public function registrarGenerales(array $data): bool
    {
        $stmt = $this->db->query(
            'INSERT INTO antecedentesgenerales(dni, HTA, HIV, DM, HEPATITIS, ALERGIAS)
             VALUES (:dni, :HTA, :HIV, :DM, :HEPATITIS, :ALERGIAS)',
            [
                ':dni'       => $data['dni'],
                ':HTA'       => $data['HTA'],
                ':HIV'       => $data['HIV'],
                ':DM'        => $data['DM'],
                ':HEPATITIS' => $data['HEPATITIS'],
                ':ALERGIAS'  => $data['ALERGIAS'],
            ]
        );

        return $stmt->rowCount() > 0;
    }

    public function actualizarGenerales(array $data): bool
    {
        $stmt = $this->db->query(
            'UPDATE antecedentesgenerales
                SET HTA = :HTA,
                    HIV = :HIV,
                    DM = :DM,
                    HEPATITIS = :HEPATITIS,
                    ALERGIAS = :ALERGIAS
              WHERE dni = :dni',
            [
                ':dni'       => $data['dni'],
                ':HTA'       => $data['HTA'],
                ':HIV'       => $data['HIV'],
                ':DM'        => $data['DM'],
                ':HEPATITIS' => $data['HEPATITIS'],
                ':ALERGIAS'  => $data['ALERGIAS'],
            ]
        );

        return $stmt->rowCount() > 0;
    }

    public function findUltimosAtencionByDni(string $dni): ?array
    {
        $row = $this->db->query(
            'SELECT aa.cirugias, aa.endoscopias, aa.covid
               FROM antecedentesAtencion aa
               INNER JOIN atencion a ON aa.idatencion = a.idatencion
              WHERE a.idpaciente = :dni
              ORDER BY a.fechaatencion DESC
              LIMIT 1',
            [':dni' => $dni]
        )->fetch() ?: [];

        return $row ?: null;
    }

    public function findAtencionById(int $idatencion): ?array
    {
        $row = $this->db->query(
            'SELECT * FROM antecedentesAtencion WHERE idatencion = :idatencion LIMIT 1',
            [':idatencion' => $idatencion]
        )->fetch() ?: [];

        return $row ?: null;
    }

    public function registrarAtencion(array $data): bool
    {
        $stmt = $this->db->query(
            'INSERT INTO antecedentesatencion(idatencion, cirugias, endoscopias, covid)
             VALUES (:idatencion, :cirugias, :endoscopias, :covid)',
            [
                ':idatencion'  => $data['idatencion'],
                ':cirugias'    => $data['cirugias'],
                ':endoscopias' => $data['endoscopias'],
                ':covid'       => $data['covid'],
            ]
        );

        return $stmt->rowCount() > 0;
    }

    public function actualizarAtencion(array $data): bool
    {
        $stmt = $this->db->query(
            'UPDATE antecedentesatencion
                SET cirugias = :cirugias,
                    endoscopias = :endoscopias,
                    covid = :covid
              WHERE idatencion = :idatencion',
            [
                ':idatencion'  => $data['idatencion'],
                ':cirugias'    => $data['cirugias'],
                ':endoscopias' => $data['endoscopias'],
                ':covid'       => $data['covid'],
            ]
        );

        return $stmt->rowCount() > 0;
    }

    public function guardarAtencion(array $data): bool
    {
        $payload = [
            'idatencion'  => (int) $data['idatencion'],
            'cirugias'    => trim((string) ($data['cirugias'] ?? '-')),
            'endoscopias' => trim((string) ($data['endoscopias'] ?? '-')),
            'covid'       => trim((string) ($data['covid'] ?? 'NO')),
        ];

        if ($this->findAtencionById($payload['idatencion'])) {
            return $this->actualizarAtencion($payload);
        }

        return $this->registrarAtencion($payload);
    }
}
