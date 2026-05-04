<?php

namespace App\Services;

use App\Models\ProcedimientoModel;
use RuntimeException;

class ProcedimientoService
{
    private ProcedimientoModel $procedimientos;

    public function __construct()
    {
        $this->procedimientos = new ProcedimientoModel();
    }

    public function listar(string $filtro = ''): array
    {
        return $filtro === ''
            ? $this->procedimientos->listar()
            : $this->procedimientos->buscar($filtro);
    }

    public function buscarPorNombre(string $nombre): array
    {
        return $this->procedimientos->buscar($nombre);
    }

    public function registrar(array $body): void
    {
        $this->procedimientos->registrar([
            'nombre' => $body['nombre'] ?? '',
            'precio' => $body['precio'] ?? '0',
        ]);
    }

    public function actualizar(int $id, array $body): void
    {
        $this->procedimientos->actualizar([
            'idtipoatencion' => $id,
            'nombre'         => $body['nombre'] ?? '',
            'precio'         => $body['precio'] ?? '0',
        ]);
    }

    public function eliminar(int $id): void
    {
        if ($this->procedimientos->tieneAtenciones($id)) {
            throw new RuntimeException(
                'No se puede eliminar: tiene atenciones registradas. Edite la información.',
                409
            );
        }
        $this->procedimientos->eliminar($id);
    }
}
