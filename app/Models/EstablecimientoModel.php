<?php

namespace App\Models;

use App\Core\Database;

class EstablecimientoModel
{
    private Database $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    public function listarEstablecimientos(): array
    {
        return $this->db->query('SELECT * FROM consultorios_externos')->fetchAll() ?: [];
    }

    public function listarTipoAtenciones(): array
    {
        return $this->db->query('SELECT * FROM tipo_atencion')->fetchAll() ?: [];
    }

    public function registrarEstablecimiento(string $nombre): bool
    {
        $stmt = $this->db->query(
            'INSERT INTO consultorios_externos(nombre) VALUES (:nombre)',
            [':nombre' => $nombre]
        );
        return $stmt->rowCount() > 0;
    }
}
