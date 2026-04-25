<?php

namespace App\Controllers;

use App\Core\Auth;
use App\Core\Request;
use App\Core\Response;
use App\Models\PersonalModel;

class PersonalController
{
    private PersonalModel $personal;

    public function __construct()
    {
        $this->personal = new PersonalModel();
    }

    /** GET /api/personal */
    public function index(Request $request): void
    {
        $cargo = (int) (Auth::user()['cargo'] ?? 0);
        $filas = $this->personal->listar();

        $data = array_map(fn($f) => [
            'dni'    => $f['dni'],
            'nombre' => $f['nombre'],
            'nick'   => $f['nick'],
            'cargo'  => $f['cargo'],
            'estado' => $f['estado'],
        ], $filas);

        Response::json(['data' => $data, 'cargo' => $cargo]);
    }

    /** GET /api/personal/cargos */
    public function cargos(Request $request): void
    {
        $filas = $this->personal->listarCargos();
        $data  = array_map(fn($f) => [
            'idcargo' => (int) $f['idcargo'],
            'nombre'  => $f['nombre'],
        ], $filas);
        Response::json($data);
    }

    /** GET /api/personal/{dni} */
    public function show(Request $request): void
    {
        $dni     = $request->param('dni') ?? $request->get('dni', '');
        $usuario = $this->personal->findByDni($dni);

        if ($usuario === null) {
            Response::json(['error' => 'No registrado'], 404);
        }

        Response::json($usuario);
    }

    /** POST /api/personal */
    public function store(Request $request): void
    {
        $body = $request->json();

        $this->personal->registrar([
            'dni'       => $body['dni'] ?? '',
            'nombre'    => $body['nombre'] ?? '',
            'apellidos' => $body['apellidos'] ?? '',
            'nick'      => $body['nick'] ?? '',
            'pass'      => password_hash($body['pass'] ?? '', PASSWORD_BCRYPT),
            'idcargo'   => $body['idcargo'] ?? '0',
            'estado'    => $body['estado'] ?? 'ACTIVO',
        ]);

        Response::json(['message' => 'Usuario registrado'], 201);
    }

    /** PUT /api/personal/{dni} */
    public function update(Request $request): void
    {
        $body = $request->json();

        $this->personal->actualizar([
            'dni'       => $request->param('dni') ?? ($body['dni'] ?? ''),
            'nombre'    => $body['nombre'] ?? '',
            'apellidos' => $body['apellidos'] ?? '',
            'nick'      => $body['nick'] ?? '',
            'idcargo'   => $body['idcargo'] ?? '0',
            'estado'    => $body['estado'] ?? 'ACTIVO',
        ]);

        Response::json(['message' => 'Usuario actualizado']);
    }

    /** POST /api/personal/cambiar-pass */
    public function cambiarPass(Request $request): void
    {
        $body = $request->json();
        $dni  = $body['dni'] ?? '';
        $hash = password_hash($body['pass'] ?? '', PASSWORD_BCRYPT);

        $this->personal->actualizarPassword($dni, $hash);
        Response::json(['message' => 'Contrasena actualizada']);
    }

    /** POST /api/personal/cargos */
    public function storeCargo(Request $request): void
    {
        $body = $request->json();
        $this->personal->registrarCargo($body['nombre'] ?? '');
        Response::json(['message' => 'Cargo registrado'], 201);
    }

    /** GET /api/personal/consulta-dni/{dni} */
    public function consultaDni(Request $request): void
    {
        $dni   = $request->param('dni') ?? '';
        $token = 'e49fddfa2a41c2c2f26d48840f7d81a66dc78dc2b0e085742a883f0ab0f84158';
        $url   = 'https://apiperu.dev/api/dni/' . urlencode($dni) . '?api_token=' . $token;

        $curl = curl_init();
        curl_setopt_array($curl, [
            CURLOPT_URL            => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => 30,
            CURLOPT_SSL_VERIFYPEER => 1,
            CURLOPT_CAINFO         => BASE_PATH . '/resources/certs/cacert.pem',
        ]);

        $response = curl_exec($curl);
        $err      = curl_error($curl);

        if ($err) {
            Response::json(['error' => 'cURL Error: ' . $err], 500);
        }

        $decoded = json_decode($response, true);
        if (!is_array($decoded)) {
            Response::json(['error' => 'Respuesta invalida del servicio de DNI'], 502);
        }

        Response::json($decoded);
    }
}
