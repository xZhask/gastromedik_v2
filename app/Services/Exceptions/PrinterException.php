<?php

namespace App\Services\Exceptions;

class PrinterException extends \RuntimeException
{
    public static function driverNotFound(string $driver): self
    {
        return new self("Driver de impresora no encontrado: {$driver}", 500);
    }

    public static function connectionFailed(string $printer): self
    {
        return new self("No se pudo conectar a la impresora: {$printer}", 500);
    }

    public static function disabled(): self
    {
        return new self("La impresora está deshabilitada en la configuración", 503);
    }

    public static function logoNotFound(string $path): self
    {
        return new self("Archivo de logo no encontrado: {$path}", 500);
    }

    public static function printFailed(string $reason): self
    {
        return new self("Error al imprimir: {$reason}", 500);
    }
}
