<?php

namespace App\Middleware;

use App\Core\Auth;
use App\Core\Request;
use App\Core\Response;

/**
 * Middleware de autenticación.
 *
 * Rechaza la petición con 401 si no hay sesión activa.
 * Añadir a las rutas protegidas:
 *
 *   $router->get('/pacientes', [PacienteController::class, 'index'])
 *          ->middleware([AuthMiddleware::class]);
 */
class AuthMiddleware
{
    public function handle(Request $request, callable $next): void
    {
        if (!Auth::check()) {
            // Si la petición es AJAX, responder con JSON
            if ($request->isAjax()) {
                Response::json(['error' => 'No autenticado. Por favor inicie sesión.'], 401);
            }
            // Si es una petición normal, redirigir al login
            Response::redirect('/login');
        }

        $next($request);
    }
}
