<?php

/**
 * Front Controller — punto de entrada único de la aplicación.
 *
 * Toda petición HTTP pasa por aquí gracias al .htaccess.
 * Responsabilidades:
 *   1. Definir constantes globales de rutas
 *   2. Cargar el autoloader de Composer (vendor + namespace App\)
 *   3. Iniciar la sesión de forma segura
 *   4. Registrar el manejador de errores
 *   5. Instanciar el Router, cargar las rutas y despachar la petición
 */

declare(strict_types=1);

ob_start(); // captura cualquier salida (warnings, notices) antes del response

ini_set('default_charset', 'UTF-8');
if (function_exists('mb_internal_encoding')) {
    mb_internal_encoding('UTF-8');
}

// ── Constantes globales ───────────────────────────────────────────────────────
define('BASE_PATH',    dirname(__DIR__));
define('APP_PATH',     BASE_PATH . '/app');
define('CONFIG_PATH',  BASE_PATH . '/config');
define('STORAGE_PATH', BASE_PATH . '/storage');
define('PUBLIC_PATH',  __DIR__);

// ── Helpers globales (config, env) ───────────────────────────────────────────
require_once APP_PATH . '/helpers.php';

// ── Autoloader ────────────────────────────────────────────────────────────────
require_once BASE_PATH . '/vendor/autoload.php';

// ── Imports ───────────────────────────────────────────────────────────────────
use App\Core\Request;
use App\Core\Router;
use App\Core\Session;
use App\Core\Response;
use App\Core\ValidationException;

// ── Configuración de errores ──────────────────────────────────────────────────
$appConfig = require CONFIG_PATH . '/app.php';

date_default_timezone_set($appConfig['timezone']);

if ($appConfig['debug']) {
    ini_set('display_errors', '1');
    error_reporting(E_ALL);
} else {
    ini_set('display_errors', '0');
    error_reporting(0);
    ini_set('log_errors', '1');
    ini_set('error_log', STORAGE_PATH . '/logs/error.log');
}

// ── Manejador global de excepciones no capturadas ─────────────────────────────
set_exception_handler(function (Throwable $e) use ($appConfig): void {
    if ($e instanceof ValidationException) {
        Response::validationError($e->getErrors());
        return;
    }

    $status = (int) $e->getCode() ?: 500;
    $safeStatus = $status >= 100 && $status < 600 ? $status : 500;

    if ($status >= 400 && $status < 500) {
        $message = $e->getMessage();
    } elseif ($appConfig['debug']) {
        $message = $e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine();
    } else {
        $message = 'Ha ocurrido un error interno. Por favor intente más tarde.';
    }

    error_log($e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine());
    Response::json(['error' => $message], $safeStatus);
});

// ── Sesión ────────────────────────────────────────────────────────────────────
Session::start();

// ── Routing ───────────────────────────────────────────────────────────────────
$request = new Request();
$router  = new Router();

require CONFIG_PATH . '/routes.php';

$router->dispatch($request);
