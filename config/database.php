<?php

return [
    'driver'   => 'mysql',
    'host'     => 'localhost',
    'database' => 'gastrome_gastromedikdb',
    'username' => 'root',
    'password' => '',
    'charset'  => 'utf8',
    'timezone' => 'America/Lima',
    'options'  => [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_PERSISTENT         => false,
        Pdo\Mysql::ATTR_INIT_COMMAND => "SET NAMES 'utf8'",
    ],
];
