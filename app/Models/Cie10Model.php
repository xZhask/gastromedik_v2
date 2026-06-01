<?php

namespace App\Models;

use App\Core\Base\BaseModel;
use PDO;

class Cie10Model extends BaseModel
{
    public function buscar(string $query, int $limit = 10): array
    {
        $qNorm = strtoupper(preg_replace('/[\s.]+/', '', $query));
        $like  = '%' . $query . '%';

        $sql = "SELECT codigo, 
                       COALESCE(descripcion_corta, descripcion) AS etiqueta, 
                       descripcion
                FROM cie10
                WHERE activo = 1
                  AND (codigo LIKE :codpref 
                       OR descripcion LIKE :like 
                       OR descripcion_corta LIKE :like)
                ORDER BY (codigo = :exacto) DESC,
                         (descripcion_corta IS NOT NULL) DESC,
                         CHAR_LENGTH(codigo) ASC,
                         codigo ASC
                LIMIT {$limit}";

        $stmt = $this->db->query($sql, [
            ':codpref' => $qNorm . '%',
            ':like'    => $like,
            ':exacto'  => $qNorm
        ]);

        return $this->fetchAll($stmt);
    }
}
