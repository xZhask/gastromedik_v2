<?php

namespace App\Models;

use App\Core\Base\BaseModel;
use PDO;

class DiagnosticoAtencionModel extends BaseModel
{
    public function listarPorAtencion(int $idAtencion): array
    {
        $sql = "SELECT codigo_cie10 AS codigo, descripcion, tipo, jerarquia
                FROM diagnosticos_atencion
                WHERE idatencion = :id
                ORDER BY (jerarquia='PRINCIPAL') DESC, iddiagnostico ASC";
        return $this->fetchAll($this->db->query($sql, [':id' => $idAtencion]));
    }

    public function eliminarPorAtencion(int $idAtencion): void
    {
        $this->db->query("DELETE FROM diagnosticos_atencion WHERE idatencion = :id", [':id' => $idAtencion]);
    }

    public function registrar(int $idAtencion, array $d): void
    {
        $sql = "INSERT INTO diagnosticos_atencion (idatencion, codigo_cie10, descripcion, tipo, jerarquia)
                VALUES (:id, :cod, :desc, :tipo, :jer)";
        $this->db->query($sql, [
            ':id'   => $idAtencion,
            ':cod'  => $d['codigo'],
            ':desc' => $d['descripcion'],
            ':tipo' => in_array($d['tipo'] ?? '', ['DEFINITIVO','PRESUNTIVO']) ? $d['tipo'] : 'PRESUNTIVO',
            ':jer'  => in_array($d['jerarquia'] ?? '', ['PRINCIPAL','SECUNDARIO']) ? $d['jerarquia'] : 'SECUNDARIO',
        ]);
    }
}
