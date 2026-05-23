<?php

namespace App\Controllers;

use App\Core\Base\BaseController;
use App\Models\DashboardModel;
use App\Core\Auth;

class DashboardController extends BaseController
{
    private DashboardModel $dashboardModel;

    public function __construct()
    {
        $this->dashboardModel = new DashboardModel();
    }

    public function kpis(): void
    {
        // Solo administradores (roles 1 y 4) pueden ver datos financieros sensibles
        if (!Auth::hasRole([1, 4])) {
            $this->json(['error' => 'No autorizado'], 403);
            return;
        }

        try {
            $kpis = $this->dashboardModel->getKpis();
            $this->json(['success' => true, 'data' => $kpis]);
        } catch (\Exception $e) {
            $this->json(['error' => 'Error al obtener KPIs: ' . $e->getMessage()], 500);
        }
    }

    public function finanzas(): void
    {
        if (!Auth::hasRole([1, 4])) {
            $this->json(['error' => 'No autorizado'], 403);
            return;
        }

        try {
            $dias = (int) ($_GET['dias'] ?? 7);
            $finanzas = $this->dashboardModel->getFinanzas($dias);
            $this->json(['success' => true, 'data' => $finanzas]);
        } catch (\Exception $e) {
            $this->json(['error' => 'Error al obtener datos financieros: ' . $e->getMessage()], 500);
        }
    }

    public function procedimientos(): void
    {
        if (!Auth::hasRole([1, 4])) {
            $this->json(['error' => 'No autorizado'], 403);
            return;
        }

        try {
            $procedimientos = $this->dashboardModel->getProcedimientosTop(5);
            $this->json(['success' => true, 'data' => $procedimientos]);
        } catch (\Exception $e) {
            $this->json(['error' => 'Error al obtener procedimientos: ' . $e->getMessage()], 500);
        }
    }
}
