<?php

namespace App\Services;

use App\Core\Database;
use App\Core\Logger;
use App\Models\MedicamentoModel;
use RuntimeException;
use Throwable;

class MedicamentoService
{
    private Database $db;
    private MedicamentoModel $medicamentos;

    public function __construct()
    {
        $this->db = Database::getInstance();
        $this->medicamentos = new MedicamentoModel();
    }

    public function listar(string $q = ''): array
    {
        return $this->medicamentos->listar($q);
    }

    public function nombres(): array
    {
        return $this->medicamentos->listar();
    }

    public function buscarNombre(string $q): array
    {
        return trim($q) === '' ? [] : $this->medicamentos->buscar(trim($q));
    }

    public function registrar(array $body, string $usuario): void
    {
        $nombre = $this->requireText($body['nombre'] ?? '', 'nombre');
        $tipo = $this->normalizeTipo($body['tipoinsumo'] ?? 'MEDICAM');
        $cantidadInicial = $this->sanitizeCantidad($body['cantidad_inicial'] ?? 0, true);

        if ($this->medicamentos->findByNombre($nombre) !== null) {
            throw new RuntimeException('El medicamento o insumo ya existe', 409);
        }

        $this->db->beginTransaction();
        try {
            $id = (int) $this->medicamentos->crear([
                'nombre' => strtoupper($nombre),
                'stock' => $cantidadInicial,
                'tipoinsumo' => $tipo,
            ]);

            if ($cantidadInicial > 0) {
                $this->medicamentos->registrarMovimiento($id, $cantidadInicial, 'I', 'INGRESO INICIAL', $usuario);
            }

            $this->db->commit();
            Logger::info('Medicamento registrado', ['id' => $id, 'nombre' => strtoupper($nombre), 'stock_inicial' => $cantidadInicial]);
        } catch (Throwable $e) {
            $this->db->rollBack();
            Logger::error('Error al registrar medicamento', ['nombre' => $nombre, 'error' => $e->getMessage()]);
            throw $e;
        }
    }

    public function actualizar(int $id, array $body): void
    {
        $actual = $this->medicamentos->obtenerPorId($id);
        if ($actual === null) {
            throw new RuntimeException('Medicamento no registrado', 404);
        }

        $nombre = $this->requireText($body['nombre'] ?? '', 'nombre');
        $tipo = $this->normalizeTipo($body['tipoinsumo'] ?? $actual['tipoinsumo']);
        $duplicado = $this->medicamentos->findByNombre($nombre);
        if ($duplicado !== null && (int) $duplicado['idmedicina'] !== $id) {
            throw new RuntimeException('El medicamento o insumo ya existe', 409);
        }

        $this->medicamentos->actualizar($id, [
            'nombre' => strtoupper($nombre),
            'stock' => (int) $actual['stock'],
            'tipoinsumo' => $tipo,
        ]);
    }

    public function eliminar(int $id): void
    {
        $actual = $this->medicamentos->obtenerPorId($id);
        if ($actual === null) {
            throw new RuntimeException('Medicamento no registrado', 404);
        }

        if ($this->medicamentos->contarMovimientos($id) > 0) {
            throw new RuntimeException('No se puede eliminar: tiene movimientos de almacen registrados', 409);
        }

        if ($this->medicamentos->contarTratamientos($id) > 0) {
            throw new RuntimeException('No se puede eliminar: esta asociado a tratamientos registrados', 409);
        }

        $this->medicamentos->eliminar($id);
    }

    public function registrarMovimiento(array $body, string $usuario): void
    {
        $id = (int) ($body['idmedicina'] ?? 0);
        $tipo = strtoupper(trim((string) ($body['tipomovimiento'] ?? '')));
        $cantidad = $this->sanitizeCantidad($body['cantidad'] ?? 0);
        $descripcion = trim((string) ($body['descripcion'] ?? ''));

        $actual = $this->medicamentos->obtenerPorId($id);
        if ($actual === null) {
            throw new RuntimeException('Producto no registrado', 404);
        }

        if (!in_array($tipo, ['I', 'S'], true)) {
            throw new RuntimeException('Tipo de movimiento invalido', 422);
        }

        if ($tipo === 'S' && (int) $actual['stock'] < $cantidad) {
            throw new RuntimeException('Stock insuficiente para registrar la salida', 409);
        }

        if ($descripcion === '') {
            $descripcion = $tipo === 'I' ? 'INGRESO DE ALMACEN' : 'SALIDA DE ALMACEN';
        }

        $this->db->beginTransaction();
        try {
            $this->medicamentos->ajustarStock($id, $cantidad, $tipo);
            $this->medicamentos->registrarMovimiento($id, $cantidad, $tipo, strtoupper($descripcion), $usuario);
            $this->db->commit();
            Logger::info('Movimiento de almacen registrado', ['idmedicina' => $id, 'tipo' => $tipo, 'cantidad' => $cantidad]);
        } catch (Throwable $e) {
            $this->db->rollBack();
            Logger::error('Error al registrar movimiento de almacen', ['idmedicina' => $id, 'error' => $e->getMessage()]);
            throw $e;
        }
    }

    private function requireText(mixed $value, string $field): string
    {
        $text = trim((string) $value);
        if ($text === '') {
            throw new RuntimeException('El campo ' . $field . ' es requerido', 422);
        }
        return $text;
    }

    private function normalizeTipo(mixed $tipo): string
    {
        $tipo = strtoupper(trim((string) $tipo));
        if (!in_array($tipo, ['MEDICAM', 'INSUMO'], true)) {
            throw new RuntimeException('Tipo de insumo invalido', 422);
        }
        return $tipo;
    }

    private function sanitizeCantidad(mixed $cantidad, bool $allowZero = false): int
    {
        $cantidad = (int) $cantidad;
        if ($allowZero) {
            if ($cantidad < 0) {
                throw new RuntimeException('La cantidad no puede ser negativa', 422);
            }
            return $cantidad;
        }
        if ($cantidad <= 0) {
            throw new RuntimeException('La cantidad debe ser mayor a cero', 422);
        }
        return $cantidad;
    }
}
