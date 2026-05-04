<?php

namespace App\Services;

use App\Models\EstablecimientoModel;

class EstablecimientoService
{
    private EstablecimientoModel $establecimientos;

    public function __construct()
    {
        $this->establecimientos = new EstablecimientoModel();
    }

    public function listar(): array
    {
        return $this->establecimientos->listarEstablecimientos();
    }

    public function listarTipoAtenciones(): array
    {
        return $this->establecimientos->listarTipoAtenciones();
    }

    public function registrar(string $nombre): void
    {
        $this->establecimientos->registrarEstablecimiento($nombre);
    }
}
