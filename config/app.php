<?php

return [
    'name'     => 'Gastromedik',
    'env'      => 'development',  // 'production' en servidor real
    'debug'    => true,
    'timezone' => 'America/Lima',
    'url'      => 'http://localhost/gastromedik/public',

    /*
    |--------------------------------------------------------------------------
    | Clave de aplicación (usada para firmar sesiones y tokens CSRF)
    |--------------------------------------------------------------------------
    | Cambiar por una cadena aleatoria de 32+ caracteres antes de producción.
    | Generar con: php -r "echo bin2hex(random_bytes(32));"
    */
    'key' => 'CAMBIA_ESTA_CLAVE_EN_PRODUCCION_32CHARS',

    /*
    |--------------------------------------------------------------------------
    | Configuración de sesión
    |--------------------------------------------------------------------------
    */
    'session' => [
        'name'     => 'gastromedik_session',
        'lifetime' => 7200,  // segundos (2 horas)
    ],
];
