<?php

/**
 * Configuración centralizada de impresoras y organización
 */

return [
    /*
    |--------------------------------------------------------------------------
    | Configuración de Impresoras
    |--------------------------------------------------------------------------
    | Define los drivers y parámetros de cada tipo de impresora disponible
    */

    'thermal' => [
        'driver'     => 'escpos',
        'name'       => env('PRINTER_THERMAL_NAME', 'IMPTICKET'),
        'connector'  => 'windows',  // windows, usb, network
        'width'      => 80,         // mm
        'timeout'    => 30,         // segundos
        'logo_path'  => '',
        'enabled'    => env('PRINTER_THERMAL_ENABLED', true),
    ],

    'pdf' => [
        'driver'     => 'mpdf',
        'format'     => [80, 150],
        'margins'    => [
            'left'   => 3,
            'right'  => 3,
            'top'    => 12,
            'bottom' => 10,
        ],
        'temp_dir'   => STORAGE_PATH . '/pdf-temp',
        'enabled'    => env('PRINTER_PDF_ENABLED', true),
    ],

    /*
    |--------------------------------------------------------------------------
    | Configuración de Organización
    |--------------------------------------------------------------------------
    | Datos de la institución que aparecen en tickets y reportes
    */

    'organization' => [
        'name'       => env('ORG_NAME', 'GASTROMEDIK'),
        'address'    => env('ORG_ADDRESS', 'Francisco Cabrera N° 419 2° Piso'),
        'city'       => env('ORG_CITY', 'Chiclayo'),
        'phone'      => env('ORG_PHONE', '(074) 618 329'),
        'mobile'     => env('ORG_MOBILE', '973 995 974'),
        'note'       => env('ORG_NOTE', 'Este no es un comprobante de Pago.'),
        'footer'     => env('ORG_FOOTER', 'Gracias por su gentil preferencia'),
    ],

    'timezone' => env('APP_TIMEZONE', 'America/Lima'),
];
