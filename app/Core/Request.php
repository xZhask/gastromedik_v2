<?php

namespace App\Core;

/**
 * Encapsula la petición HTTP entrante.
 *
 * Uso:
 *   $req = new Request();
 *   $req->method();          // 'GET' | 'POST' | 'PUT' | 'DELETE'
 *   $req->uri();             // '/pacientes/123'
 *   $req->get('q');          // $_GET['q'] ?? null
 *   $req->post('nombre');    // $_POST['nombre'] ?? null
 *   $req->param('id');       // parámetro de ruta {id}
 *   $req->json();            // body JSON como array
 *   $req->file('foto');      // $_FILES['foto'] ?? null
 *   $req->isAjax();          // true si X-Requested-With: XMLHttpRequest
 */
class Request
{
    private array $params = [];  // parámetros de ruta extraídos por el Router

    public function method(): string
    {
        // Soporte para _method en formularios HTML (PUT/DELETE simulados)
        $override = $_POST['_method'] ?? $_SERVER['HTTP_X_HTTP_METHOD_OVERRIDE'] ?? null;
        if ($override && in_array(strtoupper($override), ['PUT', 'PATCH', 'DELETE'])) {
            return strtoupper($override);
        }
        return strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
    }

    public function uri(): string
    {
        $uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
        // Eliminar el prefijo del subdirectorio si la app no está en la raíz
        $base = rtrim(dirname($_SERVER['SCRIPT_NAME']), '/');
        if ($base && str_starts_with($uri, $base)) {
            $uri = substr($uri, strlen($base));
        }
        return '/' . ltrim($uri, '/');
    }

    /** Valor de $_GET sanitizado */
    public function get(string $key, mixed $default = null): mixed
    {
        return isset($_GET[$key]) ? $this->sanitize($_GET[$key]) : $default;
    }

    /** Valor de $_POST sanitizado */
    public function post(string $key, mixed $default = null): mixed
    {
        return isset($_POST[$key]) ? $this->sanitize($_POST[$key]) : $default;
    }

    /** Todos los datos de $_POST sanitizados */
    public function all(): array
    {
        return array_map([$this, 'sanitize'], $_POST);
    }

    /** Parámetro de ruta ({id}, {slug}, etc.) */
    public function param(string $key, mixed $default = null): mixed
    {
        return $this->params[$key] ?? $default;
    }

    public function setParams(array $params): void
    {
        $this->params = $params;
    }

    /** Cuerpo de la petición como JSON decodificado */
    public function json(): array
    {
        $body = file_get_contents('php://input');
        $data = json_decode($body, true);
        return is_array($data) ? $data : [];
    }

    /** Archivo subido */
    public function file(string $key): ?array
    {
        return $_FILES[$key] ?? null;
    }

    public function isAjax(): bool
    {
        return ($_SERVER['HTTP_X_REQUESTED_WITH'] ?? '') === 'XMLHttpRequest';
    }

    public function ip(): string
    {
        return $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
    }

    public function header(string $key): ?string
    {
        $key = 'HTTP_' . strtoupper(str_replace('-', '_', $key));
        return $_SERVER[$key] ?? null;
    }

    /**
     * Sanitización básica: recorta espacios y convierte caracteres especiales HTML.
     * No escapa comillas para no romper valores que luego van a JSON.
     */
    private function sanitize(mixed $value): mixed
    {
        if (is_string($value)) {
            return trim($value);
        }
        if (is_array($value)) {
            return array_map([$this, 'sanitize'], $value);
        }
        return $value;
    }
}
