<?php

namespace App\Controllers;

use App\Core\Auth;
use App\Core\Request;
use App\Core\Response;
use App\Core\Session;

class AuthController
{
    private const MAX_ATTEMPTS  = 5;
    private const LOCKOUT_SECS  = 900;  // 15 minutos
    private const ATTEMPTS_FILE = STORAGE_PATH . '/login_attempts.json';

    public function login(Request $request): void
    {
        $ip = $this->clientIp();
        $this->checkRateLimit($ip);

        $body = $request->json();
        $nick = $body['user'] ?? '';
        $pass = $body['pass'] ?? '';

        if (Auth::attempt($nick, $pass)) {
            $this->clearAttempts($ip);
            Response::json(['message' => 'Inicio de sesion correcto', 'status' => 'INICIO']);
        }

        $this->recordFailedAttempt($ip);
        Response::json(['error' => 'Credenciales invalidas', 'status' => 'FAIL'], 401);
    }

    public function logout(Request $request): void
    {
        Session::destroy();
        Response::json(['message' => 'Sesion cerrada', 'status' => 'OK']);
    }

    public function checkSession(Request $request): void
    {
        if (!Auth::check()) {
            Response::json(['error' => 'Sesion expirada', 'status' => 'NECESITA VOLVER A LOGEAR'], 401);
        }

        Response::json(['message' => 'Sesion activa', 'status' => 'USUARIO LOGEADO']);
    }

    // ── Rate limiting ─────────────────────────────────────────────────────────

    private function checkRateLimit(string $ip): void
    {
        $data = $this->loadAttempts();

        if (!isset($data[$ip])) {
            return;
        }

        $entry = $data[$ip];

        // Expiró el bloqueo — limpiar
        if (isset($entry['locked_until']) && $entry['locked_until'] <= time()) {
            unset($data[$ip]);
            $this->saveAttempts($data);
            return;
        }

        if (isset($entry['locked_until']) && $entry['locked_until'] > time()) {
            $remaining = (int) ceil(($entry['locked_until'] - time()) / 60);
            Response::json([
                'status' => 'LOCKED',
                'error'  => "Demasiados intentos fallidos. Intente en {$remaining} minuto(s).",
            ], 429);
        }
    }

    private function recordFailedAttempt(string $ip): void
    {
        $data  = $this->loadAttempts();
        $entry = $data[$ip] ?? ['attempts' => 0, 'first_attempt' => time()];

        $entry['attempts']++;
        $entry['last_attempt'] = time();

        if ($entry['attempts'] >= self::MAX_ATTEMPTS) {
            $entry['locked_until'] = time() + self::LOCKOUT_SECS;
        }

        $data[$ip] = $entry;
        $this->saveAttempts($data);
    }

    private function clearAttempts(string $ip): void
    {
        $data = $this->loadAttempts();
        unset($data[$ip]);
        $this->saveAttempts($data);
    }

    private function loadAttempts(): array
    {
        if (!file_exists(self::ATTEMPTS_FILE)) {
            return [];
        }
        $json = file_get_contents(self::ATTEMPTS_FILE);
        return json_decode($json, true) ?? [];
    }

    private function saveAttempts(array $data): void
    {
        // Purgar entradas expiradas al guardar
        $now = time();
        foreach ($data as $ip => $entry) {
            if (isset($entry['locked_until']) && $entry['locked_until'] <= $now) {
                unset($data[$ip]);
            } elseif (!isset($entry['locked_until']) && ($now - ($entry['first_attempt'] ?? $now)) > self::LOCKOUT_SECS) {
                unset($data[$ip]);
            }
        }

        file_put_contents(
            self::ATTEMPTS_FILE,
            json_encode($data, JSON_PRETTY_PRINT),
            LOCK_EX
        );
    }

    private function clientIp(): string
    {
        return $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
    }
}
