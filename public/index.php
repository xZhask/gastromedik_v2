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

// ── Constantes globales ───────────────────────────────────────────────────────
define('BASE_PATH',    dirname(__DIR__));
define('APP_PATH',     BASE_PATH . '/app');
define('CONFIG_PATH',  BASE_PATH . '/config');
define('STORAGE_PATH', BASE_PATH . '/storage');
define('PUBLIC_PATH',  __DIR__);

// ── Autoloader ────────────────────────────────────────────────────────────────
require_once BASE_PATH . '/vendor/autoload.php';

// ── Imports ───────────────────────────────────────────────────────────────────
use App\Core\Request;
use App\Core\Router;
use App\Core\Session;
use App\Core\Response;

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
    $status  = (int) $e->getCode() ?: 500;
    $message = $appConfig['debug']
        ? $e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine()
        : 'Ha ocurrido un error interno. Por favor intente más tarde.';

    error_log($e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine());
    Response::json(['error' => $message], $status >= 100 && $status < 600 ? $status : 500);
});

// ── Sesión ────────────────────────────────────────────────────────────────────
Session::start();

// ── Routing ───────────────────────────────────────────────────────────────────
$request = new Request();
$router  = new Router();

require CONFIG_PATH . '/routes.php';

$router->dispatch($request);
