<?php
namespace App\Core;

class Response
{
    public static function json($data = [], int $statusCode = 200): void
    {
        [$payload, $error, $meta] = self::normalizePayload($data, $statusCode);

        http_response_code($statusCode);
        header('Content-Type: application/json');
        $response = [
            'success' => $statusCode >= 200 && $statusCode < 300,
            'data'    => $payload,
            'error'   => $error,
        ];

        if ($meta !== []) {
            $response['meta'] = $meta;
        }

        echo json_encode($response);
        exit;
    }

    public static function view(string $view, array $data = []): void
    {
        extract($data);

        $path = APP_PATH . '/Views/' . str_replace('.', '/', $view) . '.php';

        if (!file_exists($path)) {
            self::json(['error' => "Vista no encontrada: {$view}"], 404);
        }

        require $path;
        exit;
    }

    public static function noContent(): void
    {
        http_response_code(204);
        exit;
    }

    public static function redirect(string $url): void
    {
        header("Location: {$url}");
        exit;
    }

    private static function normalizePayload(mixed $data, int $statusCode): array
    {
        $isSuccess = $statusCode >= 200 && $statusCode < 300;
        $meta = [];

        if (!is_array($data)) {
            return [
                $isSuccess ? $data : [],
                $isSuccess ? null : (string) $data,
                $meta,
            ];
        }

        if ($isSuccess) {
            if (array_key_exists('data', $data)) {
                $payload = $data['data'];
                $meta = $data;
                unset($meta['data'], $meta['error']);
                return [$payload, null, $meta];
            }

            return [$data, null, $meta];
        }

        $error = $data['error'] ?? 'Error del servidor.';
        $payload = $data['data'] ?? [];
        $meta = $data;
        unset($meta['data'], $meta['error']);

        return [$payload, $error, $meta];
    }
}
