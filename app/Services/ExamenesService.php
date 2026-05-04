<?php

namespace App\Services;

use App\Core\Database;
use App\Core\Logger;
use App\Models\ExamenesModel;
use App\Models\PacienteModel;
use RuntimeException;
use Throwable;

class ExamenesService
{
    private Database $db;
    private ExamenesModel $examenes;
    private PacienteModel $pacientes;

    public function __construct()
    {
        $this->db = Database::getInstance();
        $this->examenes = new ExamenesModel();
        $this->pacientes = new PacienteModel();
    }

    public function listarPorPaciente(string $dni): array
    {
        $dni = $this->sanitizeDni($dni);
        return array_map(function (array $fila) {
            $fecha = date_create($fila['fecha']);
            return [
                'idexamen' => (int) $fila['idexamen'],
                'fecha' => $fecha ? date_format($fecha, 'd-m-Y H:i') : (string) $fila['fecha'],
                'nombre' => $fila['nombre'],
                'tipo' => $fila['tipoexamen'],
            ];
        }, $this->examenes->listarPorPaciente($dni));
    }

    public function obtenerDetalle(int $idexamen): array
    {
        $this->requireExamen($idexamen);
        return $this->examenes->obtenerDetalle($idexamen);
    }

    public function obtenerImagenes(int $idexamen): array
    {
        $this->requireExamen($idexamen);
        return array_map(fn(array $f) => ['archivo' => $f['archivo']], $this->examenes->obtenerDetalle($idexamen));
    }

    public function registrarImagenes(string $idpaciente, string $nombre, array $files): array
    {
        $dni = $this->sanitizePaciente($idpaciente);
        $nombre = $this->requireText($nombre, 'nombreexamen');
        $validFiles = [];

        for ($i = 1; $i <= 6; $i++) {
            $file = $files['foto' . $i] ?? null;
            if (!$file || ($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK || (int) ($file['size'] ?? 0) === 0) {
                continue;
            }
            $validFiles[] = $this->validateUpload($file, ['image/jpeg', 'image/png']);
        }

        if ($validFiles === []) {
            throw new RuntimeException('Seleccione al menos una imagen valida', 422);
        }

        $dir = BASE_PATH . '/uploads/imgs/' . $dni . '/';
        if (!is_dir($dir) && !mkdir($dir, 0777, true) && !is_dir($dir)) {
            throw new RuntimeException('No se pudo crear el directorio de imagenes', 500);
        }

        $movidos = [];
        $this->db->beginTransaction();
        try {
            $idexamen = $this->examenes->registrar([
                'dni' => $dni,
                'nombre' => $nombre,
                'fecha' => date('Y-m-d H:i:s'),
                'tipoexamen' => 'IMG',
            ]);

            $guardados = 0;
            foreach ($validFiles as $index => $file) {
                $extension = $file['mime'] === 'image/png' ? 'png' : 'jpg';
                $filename = time() . '_' . ($index + 1) . '.' . $extension;
                $destino = $dir . $filename;
                if (!move_uploaded_file($file['tmp_name'], $destino)) {
                    throw new RuntimeException('Error al guardar una de las imagenes', 500);
                }
                $movidos[] = $destino;
                $this->examenes->registrarDetalle([
                    'idexamen' => $idexamen,
                    'archivo' => 'uploads/imgs/' . $dni . '/' . $filename,
                ]);
                $guardados++;
            }

            $this->db->commit();
            Logger::info('Imagenes de examen guardadas', ['dni' => $dni, 'nombre' => $nombre, 'guardados' => $guardados]);
            return ['guardados' => $guardados];
        } catch (Throwable $e) {
            $this->db->rollBack();
            foreach ($movidos as $path) {
                if (is_file($path)) {
                    @unlink($path);
                }
            }
            Logger::error('Error al guardar imagenes de examen', ['dni' => $dni, 'error' => $e->getMessage()]);
            throw $e;
        }
    }

    public function registrarPdf(string $idpaciente, string $nombre, ?array $file): void
    {
        $dni = $this->sanitizePaciente($idpaciente);
        $nombre = $this->requireText($nombre, 'nombreexamen');
        if ($file === null) {
            throw new RuntimeException('Seleccione un archivo PDF', 422);
        }

        $validated = $this->validateUpload($file, ['application/pdf']);
        $dir = BASE_PATH . '/uploads/pdf/' . $dni . '/';
        if (!is_dir($dir) && !mkdir($dir, 0777, true) && !is_dir($dir)) {
            throw new RuntimeException('No se pudo crear el directorio del PDF', 500);
        }

        $filename = time() . '.pdf';
        $destino = $dir . $filename;

        $this->db->beginTransaction();
        try {
            $idexamen = $this->examenes->registrar([
                'dni' => $dni,
                'nombre' => $nombre,
                'fecha' => date('Y-m-d H:i:s'),
                'tipoexamen' => 'PDF',
            ]);

            if (!move_uploaded_file($validated['tmp_name'], $destino)) {
                throw new RuntimeException('Error al guardar el archivo', 500);
            }

            $this->examenes->registrarDetalle([
                'idexamen' => $idexamen,
                'archivo' => 'uploads/pdf/' . $dni . '/' . $filename,
            ]);

            $this->db->commit();
            Logger::info('PDF de examen guardado', ['dni' => $dni, 'nombre' => $nombre]);
        } catch (Throwable $e) {
            $this->db->rollBack();
            if (is_file($destino)) {
                @unlink($destino);
            }
            Logger::error('Error al guardar PDF de examen', ['dni' => $dni, 'error' => $e->getMessage()]);
            throw $e;
        }
    }

    public function eliminar(int $idexamen): void
    {
        $examen = $this->requireExamen($idexamen);
        $detalles = $this->examenes->obtenerDetalle($idexamen);

        $this->db->beginTransaction();
        try {
            $this->examenes->eliminarDetalle($idexamen);
            $this->examenes->eliminar($idexamen);
            $this->db->commit();
            Logger::info('Examen eliminado', ['idexamen' => $idexamen]);
        } catch (Throwable $e) {
            $this->db->rollBack();
            Logger::error('Error al eliminar examen', ['idexamen' => $idexamen, 'error' => $e->getMessage()]);
            throw $e;
        }

        foreach ($detalles as $detalle) {
            $path = $this->resolveStoragePath((string) ($detalle['archivo'] ?? ''));
            if ($path !== null && is_file($path)) {
                @unlink($path);
            }
        }
    }

    private function requireExamen(int $idexamen): array
    {
        if ($idexamen <= 0) {
            throw new RuntimeException('Examen invalido', 422);
        }

        $examen = $this->examenes->obtenerPorId($idexamen);
        if ($examen === null) {
            throw new RuntimeException('Examen no encontrado', 404);
        }

        return $examen;
    }

    private function sanitizePaciente(string $dni): string
    {
        $dni = $this->sanitizeDni($dni);
        if ($this->pacientes->findByDni($dni) === null) {
            throw new RuntimeException('Paciente no registrado', 404);
        }
        return $dni;
    }

    private function sanitizeDni(string $dni): string
    {
        $dni = trim($dni);
        if (!preg_match('/^\d{8}$/', $dni)) {
            throw new RuntimeException('El DNI debe tener 8 digitos', 422);
        }
        return $dni;
    }

    private function requireText(mixed $value, string $field): string
    {
        $text = trim((string) $value);
        if ($text === '') {
            throw new RuntimeException('El campo ' . $field . ' es requerido', 422);
        }
        return $text;
    }

    private function validateUpload(array $file, array $allowedMimes): array
    {
        if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK || (int) ($file['size'] ?? 0) <= 0) {
            throw new RuntimeException('Archivo invalido', 422);
        }

        $mime = mime_content_type($file['tmp_name']) ?: '';
        if (!in_array($mime, $allowedMimes, true)) {
            throw new RuntimeException('Tipo de archivo no permitido', 422);
        }

        return ['tmp_name' => $file['tmp_name'], 'mime' => $mime];
    }

    private function resolveStoragePath(string $relative): ?string
    {
        $relative = trim($relative);
        if ($relative === '') {
            return null;
        }

        $relative = str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $relative);
        return BASE_PATH . DIRECTORY_SEPARATOR . ltrim($relative, DIRECTORY_SEPARATOR);
    }
}
