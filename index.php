<?php
/**
 * Punto de entrada raíz — redirige al front controller en public/.
 *
 * Cuando Laragon/Apache sirve la raíz del proyecto (no la carpeta public/),
 * este archivo bootstrap garantiza que todas las peticiones pasen por
 * public/index.php, donde vive el Router.
 *
 * En producción configure el DocumentRoot en public/ y elimine este archivo.
 */
require __DIR__ . '/public/index.php';
