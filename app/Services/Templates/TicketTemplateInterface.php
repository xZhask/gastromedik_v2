<?php

namespace App\Services\Templates;

interface TicketTemplateInterface
{
    /**
     * Renderiza el ticket en el formato especificado
     *
     * @param array $data Datos de cita, movimiento, organización, etc
     * @param string $format 'html' para web, 'escpos' para impresora térmica
     * @return string Contenido renderizado
     */
    public function render(array $data, string $format = 'html'): string;

    /**
     * Obtiene el nombre único del template
     */
    public function getName(): string;

    /**
     * Obtiene descripción legible del template
     */
    public function getDescription(): string;
}
