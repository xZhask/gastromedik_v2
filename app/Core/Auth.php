<?php

namespace App\Core;

/**
 * Gestión de autenticación y autorización.
 *
 * Uso:
 *   Auth::attempt('admin', 'secreto')  → true / false
 *   Auth::check()                      → true si hay sesión activa
 *   Auth::user()                       → array con datos del usuario
 *   Auth::hasRole(1)                   → true si cargo == 1 (admin)
 *   Auth::logout()
 *
 *   // CSRF
 *   $token = Auth::csrfToken();        → genera / devuelve token de sesión
 *   Auth::validateCsrf($token)         → lanza excepción si no coincide
 */
class Auth
{
    private const SESSION_KEY = '_auth_user';
    private const CSRF_KEY    = '_csrf_token';

    // ── Autenticación ────────────────────────────────────────────────────────

    /**
     * Valida credenciales contra la base de datos.
     * Requiere que la contraseña esté hasheada con password_hash() en la BD.
     *
     * Durante la migración desde MD5:
     *   - Primero verifica con password_verify() (nuevo formato)
     *   - Si falla, verifica con MD5 y actualiza el hash automáticamente
     *
     * @param  string  $nick  Nombre de usuario
     * @param  string  $pass  Contraseña en texto plano
     */
    public static function attempt(string $nick, string $pass): bool
    {
        $db   = Database::getInstance();
        $stmt = $db->query(
            'SELECT dni, nick, pass, nombre, apellidos, idcargo, estado
               FROM usuario
              WHERE nick = :nick
                AND estado = "A"
              LIMIT 1',
            [':nick' => $nick]
        );

        $user = $stmt->fetch();

        if (!$user) {
            return false;
        }

        // Verificar con password_hash (nuevo formato)
        if (password_verify($pass, $user['pass'])) {
            self::login($user);
            return true;
        }

        // Compatibilidad con MD5 legacy — migra el hash en el mismo login
        if ($user['pass'] === md5($pass)) {
            $newHash = password_hash($pass, PASSWORD_BCRYPT);
            $db->query(
                'UPDATE usuario SET pass = :pass WHERE dni = :id',
                [':pass' => $newHash, ':id' => $user['dni']]
            );
            self::login($user);
            return true;
        }

        return false;
    }

    /**
     * Establece el usuario autenticado en la sesión.
     *
     * @param  array  $user  Fila de la tabla usuario
     */
    public static function login(array $user): void
    {
        // Regenerar ID de sesión al autenticar (protección contra session fixation)
        session_regenerate_id(true);

        Session::set(self::SESSION_KEY, [
            'id'       => $user['dni'],
            'nick'     => $user['nick'],
            'nombre'   => $user['nombre'],
            'apellidos'=> $user['apellidos'],
            'cargo'    => (int) $user['idcargo'],
        ]);
    }

    public static function logout(): void
    {
        Session::remove(self::SESSION_KEY);
        Session::remove(self::CSRF_KEY);
        session_regenerate_id(true);
    }

    /** ¿Hay un usuario autenticado? */
    public static function check(): bool
    {
        return Session::has(self::SESSION_KEY);
    }

    /** Datos del usuario autenticado, o null si no hay sesión. */
    public static function user(): ?array
    {
        return Session::get(self::SESSION_KEY);
    }

    /** Alias para obtener un campo específico del usuario. */
    public static function id(): mixed
    {
        return self::user()['id'] ?? null;
    }

    /**
     * Comprueba si el usuario tiene un cargo específico.
     *
     * Cargos del sistema:
     *   1 = Administrador
     *   2 = Médico
     *   4 = Caja / Administrativo
     *
     * @param  int|int[]  $role  Cargo o array de cargos permitidos
     */
    public static function hasRole(int|array $role): bool
    {
        $user = self::user();
        if (!$user) {
            return false;
        }
        $roles = is_array($role) ? $role : [$role];
        return in_array($user['cargo'], $roles, true);
    }

    // ── CSRF ─────────────────────────────────────────────────────────────────

    /**
     * Genera (o devuelve el existente) token CSRF para la sesión actual.
     */
    public static function csrfToken(): string
    {
        if (!Session::has(self::CSRF_KEY)) {
            Session::set(self::CSRF_KEY, bin2hex(random_bytes(32)));
        }
        return Session::get(self::CSRF_KEY);
    }

    /**
     * Valida el token CSRF enviado.
     * Usa hash_equals para evitar ataques de timing.
     *
     * @throws \RuntimeException  Si el token es inválido
     */
    public static function validateCsrf(string $token): void
    {
        $stored = Session::get(self::CSRF_KEY, '');
        if (!hash_equals($stored, $token)) {
            Response::json(['error' => 'Token CSRF inválido o expirado.'], 419);
        }
    }
}
