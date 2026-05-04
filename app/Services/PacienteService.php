<?php

namespace App\Services;

use App\Core\Logger;
use App\Models\AtencionModel;
use App\Models\ExamenesModel;
use App\Models\PacienteModel;
use DateTime;
use RuntimeException;

class PacienteService
{
    private PacienteModel $pacientes;
    private AtencionModel $atenciones;
    private ExamenesModel $examenes;

    public function __construct()
    {
        $this->pacientes = new PacienteModel();
        $this->atenciones = new AtencionModel();
        $this->examenes = new ExamenesModel();
    }

    public function listar(string $filtro, int $cargo): array
    {
        $filas = trim($filtro) === ''
            ? $this->pacientes->listar()
            : $this->pacientes->buscar(trim($filtro));

        return array_map(fn(array $fila) => $this->mapPaciente($fila, $cargo), $filas);
    }

    public function obtener(string $dni): array
    {
        $dni = $this->sanitizeDni($dni);
        $paciente = $this->pacientes->findByDni($dni);

        if ($paciente === null) {
            throw new RuntimeException('No registrado', 404);
        }

        return $paciente;
    }

    public function registrar(array $body): void
    {
        $payload = $this->buildPayload($body);

        if ($this->pacientes->findByDni($payload['dni']) !== null) {
            throw new RuntimeException('El DNI ya esta registrado', 409);
        }

        $this->pacientes->registrar($payload);
        Logger::info('Paciente registrado', ['dni' => $payload['dni']]);
    }

    public function actualizar(string $dni, array $body): void
    {
        $dni = $this->sanitizeDni($dni ?: (string) ($body['dni'] ?? ''));

        if ($this->pacientes->findByDni($dni) === null) {
            throw new RuntimeException('No registrado', 404);
        }

        $payload = $this->buildPayload($body, $dni);
        $this->pacientes->actualizar($payload);
        Logger::info('Paciente actualizado', ['dni' => $dni]);
    }

    public function eliminar(string $dni): void
    {
        $dni = $this->sanitizeDni($dni);

        if ($this->pacientes->findByDni($dni) === null) {
            throw new RuntimeException('No registrado', 404);
        }

        if (!empty($this->atenciones->listarPorPaciente($dni))) {
            throw new RuntimeException('No se puede eliminar: el paciente tiene atenciones registradas', 409);
        }

        if (!empty($this->examenes->listarPorPaciente($dni))) {
            throw new RuntimeException('No se puede eliminar: el paciente tiene examenes registrados', 409);
        }

        $this->pacientes->eliminar($dni);
        Logger::info('Paciente eliminado', ['dni' => $dni]);
    }

    private function buildPayload(array $body, ?string $dni = null): array
    {
        $dni = $this->sanitizeDni($dni ?? (string) ($body['dni'] ?? ''));
        $nombre = $this->requireText($body['nombre'] ?? '', 'nombre');
        $apellidos = $this->requireText($body['apellidos'] ?? '', 'apellidos');
        $telefono = $this->normalizeTelefono($body['telefono'] ?? '');
        $fechaNac = $this->sanitizeFecha($body['fecha_nac'] ?? '');

        return [
            'dni' => $dni,
            'nombre' => $nombre,
            'apellidos' => $apellidos,
            'telefono' => $telefono,
            'fecha_nac' => $fechaNac,
        ];
    }

    private function mapPaciente(array $fila, int $cargo): array
    {
        $hoy = new DateTime(date('Y-m-d'));
        $fechaNac = new DateTime($fila['fecha_nac']);

        return [
            'dni' => $fila['dni'],
            'nombre' => $fila['nombre'],
            'apellidos' => $fila['apellidos'],
            'telefono' => $fila['telefono'],
            'fecha_nac' => $fila['fecha_nac'],
            'edad' => $hoy->diff($fechaNac)->y,
            'cargo' => $cargo,
        ];
    }

    private function sanitizeDni(string $dni): string
    {
        $dni = trim($dni);

        if (!preg_match('/^\d{8}$/', $dni)) {
            throw new RuntimeException('El DNI debe tener 8 digitos', 422);
        }

        return $dni;
    }

    private function sanitizeFecha(mixed $fecha): string
    {
        $fecha = trim((string) $fecha);
        $parsed = DateTime::createFromFormat('Y-m-d', $fecha);

        if (!$parsed || $parsed->format('Y-m-d') !== $fecha) {
            throw new RuntimeException('Fecha de nacimiento invalida', 422);
        }

        if ($parsed > new DateTime(date('Y-m-d'))) {
            throw new RuntimeException('La fecha de nacimiento no puede ser futura', 422);
        }

        return $fecha;
    }

    private function normalizeTelefono(mixed $telefono): string
    {
        $telefono = trim((string) $telefono);

        if ($telefono === '') {
            return '';
        }

        if (!preg_match('/^\d{9}$/', $telefono)) {
            throw new RuntimeException('El telefono debe tener 9 digitos', 422);
        }

        return $telefono;
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
