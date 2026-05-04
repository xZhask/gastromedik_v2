<?php

namespace App\Controllers;

use App\Core\Auth;
use App\Core\Base\BaseController;
use App\Core\Request;
use App\Services\PersonalService;
use RuntimeException;

class PersonalController extends BaseController
{
    private PersonalService $personal;

    public function __construct()
    {
        $this->personal = new PersonalService();
    }

    public function index(Request $request): void
    {
        $cargo = (int) (Auth::user()['cargo'] ?? 0);
        $this->json([
            'data'  => $this->personal->listarUsuarios(),
            'cargo' => $cargo,
        ]);
    }

    public function cargos(Request $request): void
    {
        $this->json($this->personal->listarCargos());
    }

    public function show(Request $request): void
    {
        $dni = (string) ($request->param('dni') ?? $request->get('dni', ''));
        $this->json($this->personal->obtenerUsuario($dni));
    }

    public function store(Request $request): void
    {
        $this->personal->registrarUsuario($request->json());
        $this->json(['message' => 'Usuario registrado'], true, null, 201);
    }

    public function update(Request $request): void
    {
        $this->personal->actualizarUsuario((string) ($request->param('dni') ?? ''), $request->json());
        $this->json(['message' => 'Usuario actualizado']);
    }

    public function cambiarPass(Request $request): void
    {
        $this->personal->cambiarPassword($request->json());
        $this->json(['message' => 'Contrasena actualizada']);
    }

    public function storeCargo(Request $request): void
    {
        $this->personal->registrarCargo($request->json());
        $this->json(['message' => 'Cargo registrado'], true, null, 201);
    }

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
        curl_close($curl);

        if ($err) {
            throw new RuntimeException('Error al consultar servicio de DNI', 502);
        }

        $decoded = json_decode($response, true);
        if (!is_array($decoded)) {
            throw new RuntimeException('Respuesta invalida del servicio de DNI', 502);
        }

        $this->json($decoded);
    }
}
