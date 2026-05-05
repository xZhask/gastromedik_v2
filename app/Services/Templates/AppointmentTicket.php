<?php

namespace App\Services\Templates;

use App\Services\Exceptions\TicketException;

class AppointmentTicket implements TicketTemplateInterface
{
    private array $org;

    public function __construct()
    {
        $this->org = config('printers.organization');
    }

    /**
     * Renderiza el ticket en el formato solicitado.
     *
     * @param array  $data   Debe contener 'cita' y 'movimiento'
     * @param string $format 'html' (único formato soportado vía este método)
     */
    public function render(array $data, string $format = 'html'): string
    {
        $this->validateData($data);

        return $this->renderHtml($data);
    }

    /**
     * Renderiza el ticket en HTML para preview web (80 mm simulado).
     */
    private function renderHtml(array $data): string
    {
        $org  = $this->org;
        $cita = $data['cita'];
        $movimiento = $data['movimiento'];

        $paciente = htmlspecialchars(($cita['apellidospaciente'] ?? '') . ', ' . ($cita['nombrepaciente'] ?? ''));
        $dni      = htmlspecialchars($cita['dni']     ?? '');
        $fecha    = htmlspecialchars($cita['fecha']   ?? '');
        $hora     = htmlspecialchars($cita['horario'] ?? '');
        $motivo   = htmlspecialchars($cita['motivo']  ?? '');
        $precio   = htmlspecialchars((string) ($cita['precio_consulta'] ?? ''));
        $monto    = number_format((float) ($movimiento['monto'] ?? 0), 2);
        $ahora    = date('d-m-Y H:i:s');
        $idCita   = $cita['idcita'] ?? $cita['id'] ?? '';

        return <<<HTML
<div style="font-family: 'Courier New', monospace; font-size: 12px; line-height: 1.5;">
    <div style="text-align: center; margin-bottom: 12px;">
        <strong style="font-size: 14px;">{$org['name']}</strong>
    </div>
    <div style="text-align: center; font-size: 11px; margin-bottom: 12px;">
        {$org['address']}<br>
        {$org['city']}<br>
        {$org['phone']}<br>
        {$org['mobile']}<br>
        <strong>{$ahora}</strong>
    </div>
    <div style="text-align: center; font-weight: bold; font-size: 13px; margin-bottom: 12px;">
        N° CITA: {$idCita}
    </div>
    <div style="border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 8px 0; margin: 8px 0; font-size: 11px;">
        <strong>DATOS DE PACIENTE</strong><br>
        PAC.: {$paciente}<br>
        N° DOC.: {$dni}
    </div>
    <div style="border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 8px 0; margin: 8px 0; font-size: 11px;">
        <strong>DATOS DE CITA</strong><br>
        FECHA: {$fecha}<br>
        HORA: {$hora}<br>
        MOTIVO: {$motivo}<br>
        PRECIO: {$precio}<br>
        A CUENTA: {$monto}
    </div>
    <div style="text-align: center; font-size: 10px; margin-top: 12px; line-height: 1.5;">
        <strong>{$org['note']}</strong><br>
        {$org['footer']}
    </div>
</div>
HTML;
    }

    /**
     * Valida que los datos mínimos estén presentes.
     *
     * @throws TicketException
     */
    private function validateData(array $data): void
    {
        foreach (['cita', 'movimiento'] as $key) {
            if (!isset($data[$key]) || !is_array($data[$key])) {
                throw TicketException::invalidData($key);
            }
        }

        // Acepta tanto 'id' (normalizado por TicketService) como 'idcita' (raw del modelo)
        $cita = $data['cita'];
        $hasId = isset($cita['id']) || isset($cita['idcita']);

        $required = ['apellidospaciente', 'nombrepaciente', 'dni', 'fecha', 'horario', 'motivo'];
        foreach ($required as $field) {
            if (!isset($cita[$field])) {
                throw TicketException::invalidData('cita.' . $field);
            }
        }

        if (!$hasId) {
            throw TicketException::invalidData('cita.id');
        }
    }

    public function getName(): string
    {
        return 'appointment';
    }

    public function getDescription(): string
    {
        return 'Ticket de cita médica';
    }
}
