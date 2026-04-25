<?php

namespace App\Controllers;

use App\Models\MedicamentoModel;

class MedicamentoController
{
    private $medicamentoModel;

    public function __construct()
    {
        $this->medicamentoModel = new MedicamentoModel();
    }

    public function buscar()
    {
        $term = $_GET['q'] ?? '';
        // Línea 18: Verificamos que el modelo devuelva un array aunque esté vacío
        $resultados = $this->medicamentoModel->buscar($term);
        
        header('Content-Type: application/json');
        echo json_encode($resultados ?: []);
    }
}