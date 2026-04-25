<?php

namespace App\Core;

/**
 * Representa una ruta individual con su patrón, handler y middleware.
 * Se devuelve al registrar una ruta en Router para permitir encadenamiento:
 *
 *   $router->get('/ruta', [Controller::class, 'method'])->middleware([AuthMiddleware::class]);
 */
class Route
{
    private string $method;
    private string $path;
    private array  $handler;
    private array  $middlewares = [];

    public function __construct(string $method, string $path, array $handler)
    {
        $this->method  = strtoupper($method);
        $this->path    = $path;
        $this->handler = $handler;
    }

    /**
     * Agrega middleware(s) a esta ruta.
     *
     * @param  string[]  $middlewares  Nombres de clases de middleware
     */
    public function middleware(array $middlewares): self
    {
        $this->middlewares = array_merge($this->middlewares, $middlewares);
        return $this;
    }

    /**
     * Comprueba si el método y la URI coinciden con esta ruta.
     * Si coincide, rellena $params con los valores extraídos de la URI.
     *
     * @param  string  $method  Método HTTP de la petición
     * @param  string  $uri     URI de la petición (sin query string)
     * @param  array   $params  (out) parámetros de ruta extraídos
     */
    public function matches(string $method, string $uri, array &$params): bool
    {
        if ($this->method !== strtoupper($method)) {
            return false;
        }

        // Convertir {param} en grupos de captura nombrados
        $pattern = preg_replace('/\{([a-zA-Z_][a-zA-Z0-9_]*)\}/', '(?P<$1>[^/]+)', $this->path);
        $pattern = '~^' . $pattern . '$~';

        if (!preg_match($pattern, $uri, $matches)) {
            return false;
        }

        // Extraer solo los parámetros nombrados (excluir las claves numéricas)
        $params = array_filter(
            $matches,
            fn($key) => is_string($key),
            ARRAY_FILTER_USE_KEY
        );

        return true;
    }

    /**
     * Ejecuta la cadena middleware → controlador.
     */
    public function run(Request $request): void
    {
        $handler = $this->handler;

        // Construir la cadena de middleware de adentro hacia afuera
        $next = function (Request $req) use ($handler) {
            [$class, $method] = $handler;
            $controller = new $class();
            $controller->$method($req);
        };

        foreach (array_reverse($this->middlewares) as $middlewareClass) {
            $current = $next;
            $next = function (Request $req) use ($middlewareClass, $current) {
                (new $middlewareClass())->handle($req, $current);
            };
        }

        $next($request);
    }
}
