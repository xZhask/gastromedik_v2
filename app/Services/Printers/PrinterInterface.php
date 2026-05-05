<?php

namespace App\Services\Printers;

use App\Services\Exceptions\PrinterException;

interface PrinterInterface
{
    /**
     * Imprime contenido
     *
     * @param string $content Contenido formateado (ESCPOS o HTML)
     * @return void
     * @throws PrinterException
     */
    public function print(string $content): void;

    /**
     * Genera vista previa del contenido
     *
     * @param string $content Contenido formateado
     * @return string HTML para visualización web
     */
    public function preview(string $content): string;

    /**
     * Obtiene el nombre de la impresora
     */
    public function getName(): string;

    /**
     * Obtiene el tipo/driver de la impresora
     */
    public function getType(): string;
}
