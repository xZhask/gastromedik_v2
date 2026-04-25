<?php

namespace App\Controllers;

use App\Core\Auth;
use App\Core\Request;
use App\Core\Response;
use App\Models\ConsultasModel;

class PageController
{
    /** GET /login */
    public function login(Request $request): void
    {
        if (Auth::check()) {
            Response::redirect('/');
        }
        Response::view('auth.login');
    }

    /** GET / — shell SPA único */
    public function dashboard(Request $request): void
    {
        $user   = Auth::user();
        $cargo  = (int) ($user['cargo'] ?? 0);
        $iduser = $user['id'] ?? '';
        $nombre = ($user['apellidos'] ?? '') . ', ' . ($user['nombre'] ?? '');

        $tiposPago = (new ConsultasModel())->listarTiposPago();

        Response::view('app.shell', compact('cargo', 'iduser', 'nombre', 'tiposPago'));
    }

    /** GET /api/session — datos de sesión para el frontend */
    public function session(Request $request): void
    {
        $user = Auth::user();
        Response::json([
            'cargo'  => (int) ($user['cargo'] ?? 0),
            'iduser' => $user['id'] ?? '',
            'nombre' => ($user['apellidos'] ?? '') . ', ' . ($user['nombre'] ?? ''),
        ]);
    }
}
