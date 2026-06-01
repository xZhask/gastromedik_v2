<?php

namespace App\Services;

use App\Models\Cie10Model;

class Cie10Service
{
    private Cie10Model $cie10Model;

    public function __construct()
    {
        $this->cie10Model = new Cie10Model();
    }

    public function buscar(string $query): array
    {
        $query = trim($query);
        if (strlen($query) < 2) {
            return [];
        }

        return $this->cie10Model->buscar($query);
    }
}
