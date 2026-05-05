<?php

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Services\TicketService;
use App\Services\Exceptions\TicketException;

class PosController
{
    private TicketService $tickets;

    public function __construct()
    {
        $this->tickets = new TicketService();
    }

    /**
     * GET /pos/ticket/{id}/preview — Preview HTML del ticket antes de imprimir
     */
    public function preview(Request $request): void
    {
        $idCita = (int) $request->param('id', 0);
        if ($idCita <= 0) {
            Response::json(['error' => 'Cita invalida.'], 422);
        }

        try {
            $data   = $this->tickets->getData($idCita);
            $html   = $this->tickets->renderHtml($data);
            Response::view('pos.ticket-preview', compact('html', 'idCita'));
        } catch (TicketException $e) {
            Response::json(['error' => $e->getMessage()], $e->getCode() ?: 404);
        }
    }

    /**
     * POST /pos/ticket/{id}/print — Imprimir ticket en impresora térmica
     */
    public function print(Request $request): void
    {
        $idCita = (int) $request->param('id', 0);
        if ($idCita <= 0) {
            Response::json(['error' => 'Cita invalida.'], 422);
        }

        try {
            $data = $this->tickets->getData($idCita);
            $this->tickets->printThermal($data);
            Response::json(['success' => true, 'message' => 'Ticket impreso correctamente.']);
        } catch (TicketException $e) {
            Response::json(['error' => $e->getMessage()], $e->getCode() ?: 404);
        } catch (\Exception $e) {
            error_log('POS print error: ' . $e->getMessage());
            Response::json(['error' => 'Error al imprimir: ' . $e->getMessage()], 500);
        }
    }
}
