<?php

namespace App\Controllers;

use App\Core\Auth;
use App\Core\Request;
use App\Core\Response;
use App\Models\AtencionModel;
use App\Models\PacienteModel;

class PacienteController
{
    private PacienteModel $pacientes;
    private AtencionModel $atenciones;

    public function __construct()
    {
        $this->pacientes  = new PacienteModel();
        $this->atenciones = new AtencionModel();
    }

    /** GET /api/pacientes?q= */
    public function index(Request $request): void
    {
        $filtro = $request->get('q', '');
        $cargo  = (int) (Auth::user()['cargo'] ?? 0);
        $hoy    = new \DateTime(date('Y-m-d'));

        $filas = empty($filtro)
            ? $this->pacientes->listar()
            : $this->pacientes->buscar($filtro);

        $data = array_map(function ($f) use ($hoy, $cargo) {
            $fechaNac = new \DateTime($f['fecha_nac']);
            $edad     = $hoy->diff($fechaNac)->y;

            return [
                'dni'       => $f['dni'],
                'nombre'    => $f['nombre'],
                'apellidos' => $f['apellidos'],
                'telefono'  => $f['telefono'],
                'fecha_nac' => $f['fecha_nac'],
                'edad'      => $edad,
                'cargo'     => $cargo,
            ];
        }, $filas);

        Response::json($data);
    }

    /** GET /api/pacientes/{dni} */
    public function show(Request $request): void
    {
        $dni      = $request->param('dni') ?? $request->get('dni', '');
        $paciente = $this->pacientes->findByDni($dni);

        if ($paciente === null) {
            Response::json(['error' => 'No registrado'], 404);
        }

        Response::json($paciente);
    }

    /** POST /api/pacientes */
    public function store(Request $request): void
    {
        $body = $request->json();

        $this->pacientes->registrar([
            'dni'       => $body['dni'] ?? '',
            'nombre'    => $body['nombre'] ?? '',
            'apellidos' => $body['apellidos'] ?? '',
            'telefono'  => $body['telefono'] ?? '',
            'fecha_nac' => $body['fecha_nac'] ?? '',
        ]);

        Response::json(['message' => 'Paciente registrado'], 201);
    }

    /** PUT /api/pacientes/{dni} */
    public function update(Request $request): void
    {
        $body = $request->json();

        $this->pacientes->actualizar([
            'dni'       => $request->param('dni') ?? ($body['dni'] ?? ''),
            'nombre'    => $body['nombre'] ?? '',
            'apellidos' => $body['apellidos'] ?? '',
            'telefono'  => $body['telefono'] ?? '',
            'fecha_nac' => $body['fecha_nac'] ?? '',
        ]);

        Response::json(['message' => 'Paciente actualizado']);
    }

    /** DELETE /api/pacientes/{dni} */
    public function destroy(Request $request): void
    {
        $dni       = $request->param('dni') ?? '';
        $historial = $this->atenciones->listarPorPaciente($dni);

        if (!empty($historial)) {
            Response::json(['error' => 'No se puede eliminar: el paciente tiene atenciones registradas'], 409);
        }

        $this->pacientes->eliminar($dni);
        Response::noContent();
    }
}
