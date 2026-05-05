<?php

namespace App\Services\Exceptions;

class TicketException extends \RuntimeException
{
    public static function citaNotFound(int $idCita): self
    {
        return new self("Cita no encontrada: {$idCita}", 404);
    }

    public static function invalidData(string $field): self
    {
        return new self("Dato inválido: {$field}", 422);
    }

    public static function templateNotRegistered(string $name): self
    {
        return new self("Template no registrado: {$name}", 500);
    }
}
