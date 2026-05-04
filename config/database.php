<?php

// PHP 8.4+ usa Pdo\Mysql::ATTR_INIT_COMMAND; versiones anteriores usan PDO::MYSQL_ATTR_INIT_COMMAND
$mysqlInitCmd = class_exists('Pdo\Mysql') ? Pdo\Mysql::ATTR_INIT_COMMAND : PDO::MYSQL_ATTR_INIT_COMMAND;

return [
    'driver'   => 'mysql',
    'host'     => 'localhost',
    'database' => 'gastrome_gastromedikdb',
    'username' => 'root',
    'password' => '',
    'charset'  => 'utf8mb4',
    'timezone' => 'America/Lima',
    'options'  => [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_PERSISTENT         => false,
        $mysqlInitCmd                => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci",
    ],
];
