<?php

namespace App\Middleware;

use App\Core\Auth;
use App\Core\Request;
use App\Core\Response;

/**
 * Middleware de protección CSRF.
 *
 * Valida el token X-CSRF-Token (header) o _csrf_token (body)
 * en todas las peticiones de escritura (POST, PUT, PATCH, DELETE).
 *
 * En formularios HTML, incluir el token como campo oculto:
 *   <input type="hidden" name="_csrf_token" value="<?= Auth::csrfToken() ?>">
 *
 * En peticiones AJAX, enviar como header:
 *   fetch('/ruta', {
 *       method: 'POST',
 *       headers: { 'X-CSRF-Token': document.querySelector('meta[name=csrf-token]').content },
 *   });
 *
 * En el layout HTML incluir:
 *   <meta name="csrf-token" content="<?= Auth::csrfToken() ?>">
 */
class CsrfMiddleware
{
    private const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];

    public function handle(Request $request, callable $next): void
    {
        if (in_array($request->method(), self::SAFE_METHODS, true)) {
            $next($request);
            return;
        }

        // Buscar token en header o en body
        $token = $request->header('X-CSRF-Token')
            ?? $request->post('_csrf_token')
            ?? '';

        Auth::validateCsrf($token);  // lanza Response::json 419 si inválido

        $next($request);
    }
}
