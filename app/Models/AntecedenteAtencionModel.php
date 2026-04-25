<?php

namespace App\Models;

use App\Core\Database;

class AntecedenteAtencionModel
{
    private $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    /**
     * Registra los antecedentes específicos de una atención
     */
    public function guardar(array $data): bool
    {
        return $this->db->query(
            "INSERT INTO antecedentesAtencion (idatencion, cirugias, endoscopias, covid) 
             VALUES (:idatencion, :cirugias, :endoscopias, :covid)
             ON DUPLICATE KEY UPDATE 
                cirugias = :cirugias, 
                endoscopias = :endoscopias, 
                covid = :covid",
            [
                ':idatencion'  => $data['idatencion'],
                ':cirugias'    => $data['cirugias'] ?? '-',
                ':endoscopias' => $data['endoscopias'] ?? '-',
                ':covid'       => $data['covid'] ?? 'NO'
            ]
        )->rowCount() > 0;
    }
}