<?php

namespace App\Services;

use App\Core\Database;
use App\Core\Logger;
use App\Core\ValidationException;
use App\Core\Validator;
use App\Models\AtencionModel;
use App\Models\AntecedentesModel;
use RuntimeException;
use Throwable;

class AtencionService
{
    private Database $db;
    private AtencionModel $atencion;
    private AntecedentesModel $antecedentes;

    public function __construct()
    {
        $this->db = Database::getInstance();
        $this->atencion = new AtencionModel();
        $this->antecedentes = new AntecedentesModel();
    }

    public function listarPorFecha(string $fecha): array
    {
        return array_map(fn(array $r): array => [
            'idatencion'    => (int) $r['idatencion'],
            'fechaatencion' => $r['fechaatencion'],
            'paciente'      => trim($r['nombre'] . ' ' . $r['apellidos']),
            'dni'           => $r['idpaciente'],
            'motivo'        => $r['motivoconsulta'] ?? '',
            'estado'        => $r['estado'],
        ], $this->atencion->listarPorFecha($fecha));
    }

    public function obtener(int $id): array
    {
        $atencion = $this->atencion->obtenerConDetalles($id);
        if ($atencion === null) {
            throw new RuntimeException('Atencion no encontrada', 404);
        }
        return $atencion;
    }

    public function listarPorPaciente(string $dni): array
    {
        return array_map(fn(array $r): array => [
            'idatencion' => (int) $r['idatencion'],
            'fecha'      => $r['fechaatencion'],
            'nombre'     => $r['motivoconsulta'] ?? 'Consulta',
            'tipo'       => 'consulta',
        ], $this->atencion->listarPorPaciente($dni));
    }

    public function antecedentesGenerales(string $dni): array
    {
        $generales = $this->antecedentes->findGeneralesByDni($dni) ?? [];
        $atencion  = $this->antecedentes->findUltimosAtencionByDni($dni) ?? [];
        return array_merge($generales, $atencion);
    }

    public function signosVitales(int $idAtencion): ?array
    {
        return $this->atencion->obtenerSignos($idAtencion);
    }

    public function guardarAtencion(array $body): void
    {
        $v = Validator::make($body, [
            'idatencion' => 'required|integer',
        ]);
        if ($v->fails()) {
            throw new ValidationException($v->errors());
        }

        $idAtencion = (int) $body['idatencion'];
        $dni        = trim($body['dni'] ?? '');

        $this->db->beginTransaction();

        try {
            $this->atencion->actualizar($idAtencion, [
                'motivoconsulta' => trim($body['molestia'] ?? ''),
                'antecedente'    => trim($body['antecedentes'] ?? ''),
                'anamensis'      => trim($body['anamnesis'] ?? ''),
                'exfisico'       => trim($body['examen_fisico'] ?? ''),
                'diagnostico'    => trim($body['diagnostico'] ?? ''),
                'tratamiento'    => trim($body['tratamiento'] ?? ''),
                'estado'         => 'FINALIZADO',
                'fechaatencion'  => date('Y-m-d H:i:s'),
            ]);

            if ($dni !== '') {
                $antData = [
                    'dni'       => $dni,
                    'HTA'       => $body['hta'] ?? 'NO',
                    'HIV'       => $body['hiv'] ?? 'NO',
                    'DM'        => $body['dm'] ?? 'NO',
                    'HEPATITIS' => $body['hep'] ?? 'NO',
                    'ALERGIAS'  => trim($body['alergias'] ?? '-'),
                ];

                if ($this->antecedentes->findGeneralesByDni($dni)) {
                    $this->antecedentes->actualizarGenerales($antData);
                } else {
                    $this->antecedentes->registrarGenerales($antData);
                }
            }

            $this->antecedentes->guardarAtencion([
                'idatencion'  => $idAtencion,
                'cirugias'    => trim($body['cirugias'] ?? '-'),
                'endoscopias' => trim($body['endoscopias'] ?? '-'),
                'covid'       => $body['covid'] ?? 'NO',
            ]);

            $this->db->commit();
            Logger::info('Atencion guardada', ['idatencion' => $idAtencion, 'dni' => $dni]);
        } catch (Throwable $e) {
            $this->db->rollBack();
            Logger::error('Error al guardar atencion', ['idatencion' => $idAtencion, 'error' => $e->getMessage()]);
            throw $e;
        }
    }

    public function registrarSignos(array $body): void
    {
        $v = Validator::make($body, [
            'idatencion' => 'required|integer',
        ]);
        if ($v->fails()) {
            throw new ValidationException($v->errors());
        }

        $idAtencion = (int) $body['idatencion'];

        $this->atencion->guardarSignos($idAtencion, [
            'fr'   => $body['fc'] ?? '',
            'pa'   => $body['pa'] ?? '',
            'temp' => $body['temp'] ?? '',
            'so2'  => $body['so2'] ?? '',
            'peso' => $body['peso'] ?? '',
        ]);
    }
}
