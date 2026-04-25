<?php

namespace App\Core;

/**
 * Router HTTP minimalista.
 *
 * Registra rutas y despacha la petición al controlador correcto
 * pasándola por la cadena de middleware definida.
 *
 * Ejemplo en config/routes.php:
 *
 *   $router->get('/pacientes',      [PacienteController::class, 'index'])
 *          ->middleware([AuthMiddleware::class]);
 *
 *   $router->post('/pacientes',     [PacienteController::class, 'store'])
 *          ->middleware([AuthMiddleware::class, CsrfMiddleware::class]);
 *
 *   $router->get('/pacientes/{id}', [PacienteController::class, 'show'])
 *          ->middleware([AuthMiddleware::class]);
 */
class Router
{
    /** @var Route[] */
    private array $routes = [];

    // ── Métodos de registro ──────────────────────────────────────────────────

    public function get(string $path, array $handler): Route
    {
        return $this->add('GET', $path, $handler);
    }

    public function post(string $path, array $handler): Route
    {
        return $this->add('POST', $path, $handler);
    }

    public function put(string $path, array $handler): Route
    {
        return $this->add('PUT', $path, $handler);
    }

    public function patch(string $path, array $handler): Route
    {
        return $this->add('PATCH', $path, $handler);
    }

    public function delete(string $path, array $handler): Route
    {
        return $this->add('DELETE', $path, $handler);
    }

    private function add(string $method, string $path, array $handler): Route
    {
        $route = new Route($method, $path, $handler);
        $this->routes[] = $route;
        return $route;
    }

    // ── Despacho ─────────────────────────────────────────────────────────────

    public function dispatch(Request $request): void
    {
        $method = $request->method();
        $uri    = $request->uri();
        $params = [];

        foreach ($this->routes as $route) {
            if ($route->matches($method, $uri, $params)) {
                $request->setParams($params);
                $route->run($request);
                return;
            }
        }

        Response::json(['error' => 'Ruta no encontrada.'], 404);
    }
}
