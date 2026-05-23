<?php

namespace App\Services;

use App\Models\CitaModel;
use App\Models\CajaModel;
use App\Services\Templates\AppointmentTicket;
use App\Services\Exceptions\TicketException;
use Mike42\Escpos\Printer;
use Mike42\Escpos\EscposImage;
use Mike42\Escpos\PrintConnectors\WindowsPrintConnector;

class TicketService
{
    private CitaModel $citas;
    private CajaModel $caja;

    public function __construct()
    {
        $this->citas = new CitaModel();
        $this->caja  = new CajaModel();
        date_default_timezone_set(config('printers.timezone') ?? 'America/Lima');
    }

    /**
     * Obtiene los datos completos para generar el ticket.
     *
     * @throws TicketException si la cita no existe
     */
    public function getData(int $idCita): array
    {
        $cita = $this->citas->find($idCita);

        if ($cita === null) {
            throw TicketException::citaNotFound($idCita);
        }

        // Normalizar clave para compatibilidad con AppointmentTicket
        $cita['id'] = $cita['idcita'];

        $movimiento = $this->caja->findMovimientoPorCita($idCita) ?? [];
        $totalPagado = $this->caja->sumarIngresosPorCita($idCita);

        return compact('cita', 'movimiento', 'totalPagado');
    }

    /**
     * Renderiza el ticket en HTML para preview web.
     */
    public function renderHtml(array $data): string
    {
        return (new AppointmentTicket())->render($data, 'html');
    }

    /**
     * Imprime el ticket directamente en la impresora térmica vía ESCPOS.
     *
     * @throws \RuntimeException si no se puede conectar a la impresora
     */
    public function printThermal(array $data): void
    {
        $config = config('printers.thermal');
        $org    = config('printers.organization');
        $cita   = $data['cita'];
        $movimiento = $data['movimiento'];
        $totalPagado = $data['totalPagado'] ?? 0;

        $connector = new WindowsPrintConnector($config['name']);
        $printer   = new Printer($connector);

        try {
            $printer->setJustification(Printer::JUSTIFY_CENTER);

            // Logo (opcional)
            try {
                $logoPath = $config['logo_path'] ?? '';
                if ($logoPath && file_exists($logoPath)) {
                    $logo = EscposImage::load($logoPath, false);
                    $printer->bitImage($logo);
                }
            } catch (\Exception $e) {
                // Continuar sin logo
            }

            // Encabezado
            $printer->text(($org['name']    ?? '') . "\n");
            $printer->text(($org['address'] ?? '') . "\n");
            $printer->text(($org['city']    ?? '') . "\n");
            $printer->text(($org['phone']   ?? '') . "\n");
            $printer->text(($org['mobile']  ?? '') . "\n");
            $printer->text(date('d-m-Y H:i:s') . "\n");

            // Número de cita en doble ancho
            $printer->selectPrintMode(Printer::MODE_DOUBLE_WIDTH);
            $printer->text('N° CITA : ' . ($cita['idcita'] ?? '') . "\n");
            $printer->selectPrintMode(Printer::MODE_FONT_A);
            $printer->setJustification(Printer::JUSTIFY_LEFT);

            // Datos del paciente
            $printer->text('---- DATOS DE PACIENTE ------' . "\n");
            $printer->text('PAC.     : ' . ($cita['apellidospaciente'] ?? '') . ', ' . ($cita['nombrepaciente'] ?? '') . "\n");
            $printer->text('N° DOC.  : ' . ($cita['dni'] ?? '') . "\n");

            // Datos de la cita
            $printer->text('---- DATOS DE CITA ------' . "\n");
            
            $fechaCitaStr = ($cita['fecha'] ?? '') . ' ' . ($cita['horario'] ?? '00:00:00');
            $isFuture = strtotime($fechaCitaStr) > time();
            
            if ($isFuture) {
                $printer->text('FECHA    : ' . ($cita['fecha']    ?? '') . "\n");
                $printer->text('HORA     : ' . substr((string)($cita['horario'] ?? ''), 0, 5) . "\n");
            }
            
            $printer->text('MOTIVO   : Pago por ' . ($cita['motivo']   ?? '') . "\n");
            
            $precio = (float) ($cita['precio_consulta'] ?? 0);
            $saldo  = max(0, $precio - $totalPagado);
            
            $printer->text('PRECIO   : ' . number_format($precio, 2) . "\n");
            $printer->text('PAGADO   : ' . number_format((float) $totalPagado, 2) . "\n");
            
            if ($saldo > 0) {
                $printer->text('SALDO    : ' . number_format($saldo, 2) . "\n");
            }

            // Pie
            $printer->text('--------------------------------------------' . "\n");
            $printer->setJustification(Printer::JUSTIFY_CENTER);
            $printer->text('Este documento es informativo y no un comprobante de pago.' . "\n");
            $printer->text(($org['footer'] ?? 'Gracias por su gentil preferencia') . "\n");

            $printer->feed(3);
            $printer->cut();
            $printer->pulse();
        } finally {
            $printer->close();
        }
    }
}
