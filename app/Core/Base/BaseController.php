<?php

namespace App\Core\Base;

use App\Core\Response;

class BaseController
{
    protected function json($data = [], $success = true, $error = null, ?int $statusCode = null): void
    {
        $statusCode ??= $success ? 200 : 400;

        if (!$success) {
            $payload = ['error' => $error ?? 'Solicitud no procesada'];
            if (!empty($data)) {
                $payload['data'] = $data;
            }
            Response::json($payload, $statusCode);
            return;
        }

        Response::json($data, $statusCode);
    }

    protected function noContent(): void
    {
        Response::noContent();
    }
}
