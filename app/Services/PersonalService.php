<?php

namespace App\Services;

use App\Core\Logger;
use App\Models\PersonalModel;
use RuntimeException;

class PersonalService
{
    private PersonalModel $personal;

    public function __construct()
    {
        $this->personal = new PersonalModel();
    }

    public function listarUsuarios(): array
    {
        return array_map(fn(array $fila) => $this->mapUsuario($fila), $this->personal->listar());
    }

    public function listarCargos(): array
    {
        return array_map(static fn(array $fila) => [
            'idcargo' => (int) $fila['idcargo'],
            'nombre' => $fila['nombre'],
        ], $this->personal->listarCargos());
    }

    public function obtenerUsuario(string $dni): array
    {
        $dni = $this->sanitizeDni($dni, false);
        $usuario = $this->personal->findByDni($dni);

        if ($usuario === null) {
            throw new RuntimeException('No registrado', 404);
        }

        return $this->mapUsuario($usuario);
    }

    public function registrarUsuario(array $body): void
    {
        $dni = $this->sanitizeDni((string) ($body['dni'] ?? ''));
        $nombre = $this->requireText($body['nombre'] ?? '', 'nombre');
        $apellidos = $this->requireText($body['apellidos'] ?? '', 'apellidos');
        $nick = $this->requireText($body['nick'] ?? '', 'usuario');
        $pass = (string) ($body['pass'] ?? '');
        $idcargo = $this->sanitizeCargo($body['idcargo'] ?? 0);
        $estado = $this->normalizeEstado($body['estado'] ?? 'ACTIVO');

        if (strlen(trim($pass)) < 4) {
            throw new RuntimeException('La contrasena debe tener al menos 4 caracteres', 422);
        }

        if ($this->personal->findByDni($dni) !== null) {
            throw new RuntimeException('El DNI ya esta registrado', 409);
        }

        $duplicadoNick = $this->personal->findByNick($nick);
        if ($duplicadoNick !== null) {
            throw new RuntimeException('El usuario ya existe', 409);
        }

        $this->personal->registrar([
            'dni' => $dni,
            'nombre' => $nombre,
            'apellidos' => $apellidos,
            'nick' => strtoupper($nick),
            'pass' => password_hash($pass, PASSWORD_BCRYPT),
            'idcargo' => $idcargo,
            'estado' => $estado,
        ]);
        Logger::info('Usuario registrado', ['dni' => $dni, 'nick' => strtoupper($nick)]);
    }

    public function actualizarUsuario(string $dni, array $body): void
    {
        $dni = $this->sanitizeDni($dni ?: (string) ($body['dni'] ?? ''));
        $actual = $this->personal->findByDni($dni);

        if ($actual === null) {
            throw new RuntimeException('No registrado', 404);
        }

        $nombre = $this->requireText($body['nombre'] ?? '', 'nombre');
        $apellidos = $this->requireText($body['apellidos'] ?? '', 'apellidos');
        $nick = $this->requireText($body['nick'] ?? '', 'usuario');
        $idcargo = $this->sanitizeCargo($body['idcargo'] ?? 0);
        $estado = $this->normalizeEstado($body['estado'] ?? $actual['estado']);

        $duplicadoNick = $this->personal->findByNick($nick);
        if ($duplicadoNick !== null && $duplicadoNick['dni'] !== $dni) {
            throw new RuntimeException('El usuario ya existe', 409);
        }

        $this->personal->actualizar([
            'dni' => $dni,
            'nombre' => $nombre,
            'apellidos' => $apellidos,
            'nick' => strtoupper($nick),
            'idcargo' => $idcargo,
            'estado' => $estado,
        ]);
        Logger::info('Usuario actualizado', ['dni' => $dni]);
    }

    public function cambiarPassword(array $body): void
    {
        $dni = $this->sanitizeDni((string) ($body['dni'] ?? ''));
        $pass = (string) ($body['pass'] ?? '');

        if ($this->personal->findByDni($dni) === null) {
            throw new RuntimeException('No registrado', 404);
        }

        if (strlen(trim($pass)) < 4) {
            throw new RuntimeException('La contrasena debe tener al menos 4 caracteres', 422);
        }

        $this->personal->actualizarPassword($dni, password_hash($pass, PASSWORD_BCRYPT));
        Logger::info('Password actualizado', ['dni' => $dni]);
    }

    public function registrarCargo(array $body): void
    {
        $nombre = strtoupper($this->requireText($body['nombre'] ?? '', 'cargo'));

        if ($this->personal->findCargoByNombre($nombre) !== null) {
            throw new RuntimeException('El cargo ya existe', 409);
        }

        $this->personal->registrarCargo($nombre);
        Logger::info('Cargo registrado', ['nombre' => $nombre]);
    }

    private function mapUsuario(array $fila): array
    {
        return [
            'dni' => $fila['dni'],
            'nombre' => $fila['nombre'] ?? '',
            'apellidos' => $fila['apellidos'] ?? '',
            'nombre_completo' => trim(($fila['apellidos'] ?? '') . ', ' . ($fila['nombre'] ?? ''), ', '),
            'nick' => $fila['nick'] ?? '',
            'idcargo' => (int) ($fila['idcargo'] ?? 0),
            'cargo' => $fila['cargo'] ?? '',
            'estado' => $this->presentEstado((string) ($fila['estado'] ?? 'A')),
        ];
    }

    private function sanitizeDni(string $dni, bool $required = true): string
    {
        $dni = trim($dni);

        if ($dni === '' && !$required) {
            return '';
        }

        if (!preg_match('/^\d{8}$/', $dni)) {
            throw new RuntimeException('El DNI debe tener 8 digitos', 422);
        }

        return $dni;
    }

    private function sanitizeCargo(mixed $idcargo): int
    {
        $idcargo = (int) $idcargo;

        if ($idcargo <= 0) {
            throw new RuntimeException('Cargo invalido', 422);
        }

        if ($this->personal->findCargoById($idcargo) === null) {
            throw new RuntimeException('Cargo no registrado', 422);
        }

        return $idcargo;
    }

    private function normalizeEstado(mixed $estado): string
    {
        $estado = strtoupper(trim((string) $estado));

        return match ($estado) {
            'A', 'ACTIVO' => 'A',
            'I', 'INACTIVO' => 'I',
            default => throw new RuntimeException('Estado invalido', 422),
        };
    }

    private function presentEstado(string $estado): string
    {
        return strtoupper($estado) === 'I' ? 'INACTIVO' : 'ACTIVO';
    }

    private function requireText(mixed $value, string $field): string
    {
        $text = trim((string) $value);

        if ($text === '') {
            throw new RuntimeException('El campo ' . $field . ' es requerido', 422);
        }

        return $text;
    }
}
