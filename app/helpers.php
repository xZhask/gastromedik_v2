<?php

/**
 * Obtiene un valor de configuración usando notación de punto.
 * Ejemplo: config('printers.thermal.name')
 */
function config(string $key, mixed $default = null): mixed
{
    static $cache = [];

    $parts = explode('.', $key);
    $file  = array_shift($parts);

    if (!isset($cache[$file])) {
        $path = CONFIG_PATH . '/' . $file . '.php';
        $cache[$file] = file_exists($path) ? (require $path) : [];
    }

    $value = $cache[$file];

    foreach ($parts as $part) {
        if (!is_array($value) || !array_key_exists($part, $value)) {
            return $default;
        }
        $value = $value[$part];
    }

    return $value;
}

/**
 * Lee una variable de entorno con soporte para valores booleanos y nulos.
 */
function env(string $key, mixed $default = null): mixed
{
    $value = $_ENV[$key] ?? getenv($key);

    if ($value === false) {
        return $default;
    }

    return match (strtolower((string) $value)) {
        'true',  '(true)'  => true,
        'false', '(false)' => false,
        'null',  '(null)'  => null,
        'empty', '(empty)' => '',
        default            => $value,
    };
}
