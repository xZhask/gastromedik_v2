<?php

namespace App\Services;

use App\Core\Database;
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

    public function guardarAtencion(array $body): void
    {
        $idAtencion = (int) ($body['idatencion'] ?? 0);
        $dni = trim($body['dni'] ?? '');

        if ($idAtencion <= 0) {
            throw new RuntimeException('ID de atencion requerido', 422);
        }

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
        } catch (Throwable $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    public function registrarSignos(array $body): void
    {
        $idAtencion = (int) ($body['idatencion'] ?? 0);

        if ($idAtencion <= 0) {
            throw new RuntimeException('ID de atencion requerido', 422);
        }

        $this->atencion->guardarSignos($idAtencion, [
            'fr'   => $body['fc'] ?? '',
            'pa'   => $body['pa'] ?? '',
            'temp' => $body['temp'] ?? '',
            'so2'  => $body['so2'] ?? '',
            'peso' => $body['peso'] ?? '',
        ]);
    }

    public function registrarTratamiento(array $body): int
    {
        $idAtencion = (int) ($body['idatencion'] ?? 0);
        $idMedicina = (int) ($body['idmedicina'] ?? 0);

        if ($idAtencion <= 0) {
            throw new RuntimeException('ID de atencion requerido', 422);
        }

        if ($idMedicina <= 0) {
            throw new RuntimeException('Medicamento requerido', 422);
        }

        return (int) $this->atencion->agregarTratamiento($idAtencion, [
            'idmedicina'   => $idMedicina,
            'indicaciones' => trim($body['indicaciones'] ?? ''),
        ]);
    }
}
