<?php

namespace App\Services\Printers;

use App\Services\Exceptions\PrinterException;

class PrinterFactory
{
    /**
     * Crea una instancia de impresora según el tipo
     *
     * @param string $type Tipo de impresora: 'thermal' o 'pdf'
     * @return PrinterInterface
     * @throws PrinterException
     */
    public static function make(string $type): PrinterInterface
    {
        $config = config('printers.' . $type);

        if (!$config) {
            throw PrinterException::driverNotFound($type);
        }

        if (!$config['enabled']) {
            throw PrinterException::disabled();
        }

        return match ($config['driver']) {
            'escpos' => new ThermalPrinter($config),
            'mpdf'   => new PdfPrinter($config),
            default  => throw PrinterException::driverNotFound($config['driver']),
        };
    }
}
