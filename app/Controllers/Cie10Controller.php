<?php

namespace App\Controllers;

use App\Core\Base\BaseController;
use App\Services\Cie10Service;
use Throwable;

class Cie10Controller extends BaseController
{
    private Cie10Service $cie10Service;

    public function __construct()
    {
        $this->cie10Service = new Cie10Service();
    }

    public function buscar(): void
    {
        try {
            $query = $_GET['q'] ?? '';
            $resultados = $this->cie10Service->buscar($query);
            $this->json(['data' => $resultados]);
        } catch (Throwable $e) {
            $this->json(['error' => 'Error al buscar diagnósticos: ' . $e->getMessage()], 500);
        }
    }
}
