<?php

namespace App\Core;

/**
 * Gestión de sesiones PHP con configuración segura.
 *
 * Uso:
 *   Session::start();
 *   Session::set('user', $data);
 *   $user = Session::get('user');
 *   Session::flash('success', 'Guardado correctamente.');
 *   $msg  = Session::getFlash('success');
 */
class Session
{
    private static bool $started = false;

    /**
     * Inicia la sesión con parámetros seguros.
     * Llámalo una sola vez desde el front controller.
     */
    public static function start(): void
    {
        if (self::$started || session_status() === PHP_SESSION_ACTIVE) {
            self::$started = true;
            return;
        }

        $cfg = require BASE_PATH . '/config/app.php';

        session_name($cfg['session']['name']);

        session_set_cookie_params([
            'lifetime' => $cfg['session']['lifetime'],
            'path'     => '/',
            'secure'   => false,   // true en producción con HTTPS
            'httponly' => true,
            'samesite' => 'Strict',
        ]);

        session_start();
        self::$started = true;

        // Regenerar ID de sesión si es nueva (protección contra fijación)
        if (empty($_SESSION['_initiated'])) {
            session_regenerate_id(true);
            $_SESSION['_initiated'] = true;
        }
    }

    public static function set(string $key, mixed $value): void
    {
        $_SESSION[$key] = $value;
    }

    public static function get(string $key, mixed $default = null): mixed
    {
        return $_SESSION[$key] ?? $default;
    }

    public static function has(string $key): bool
    {
        return isset($_SESSION[$key]);
    }

    public static function remove(string $key): void
    {
        unset($_SESSION[$key]);
    }

    /**
     * Almacena un mensaje que se consume una sola vez (flash message).
     */
    public static function flash(string $key, mixed $value): void
    {
        $_SESSION['_flash'][$key] = $value;
    }

    /**
     * Obtiene y elimina un flash message.
     */
    public static function getFlash(string $key, mixed $default = null): mixed
    {
        $value = $_SESSION['_flash'][$key] ?? $default;
        unset($_SESSION['_flash'][$key]);
        return $value;
    }

    public static function hasFlash(string $key): bool
    {
        return isset($_SESSION['_flash'][$key]);
    }

    /**
     * Destruye la sesión completamente.
     */
    public static function destroy(): void
    {
        $_SESSION = [];
        if (ini_get('session.use_cookies')) {
            $p = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000, $p['path'], $p['domain'], $p['secure'], $p['httponly']);
        }
        session_destroy();
        self::$started = false;
    }
}
