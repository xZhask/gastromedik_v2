<?php

namespace App\Core;

use PDO;
use PDOException;
use RuntimeException;

/**
 * Singleton de acceso a base de datos.
 *
 * Uso:
 *   $db  = Database::getInstance();
 *   $stmt = $db->query('SELECT * FROM paciente WHERE dni = :dni', [':dni' => $dni]);
 *   $rows = $stmt->fetchAll();
 */
class Database
{
    private static ?Database $instance = null;
    private PDO $pdo;

    private function __construct()
    {
        $cfg = require BASE_PATH . '/config/database.php';

        date_default_timezone_set($cfg['timezone']);

        $dsn = "{$cfg['driver']}:host={$cfg['host']};dbname={$cfg['database']};charset={$cfg['charset']}";

        try {
            $this->pdo = new PDO($dsn, $cfg['username'], $cfg['password'], $cfg['options']);
        } catch (PDOException $e) {
            $app = require BASE_PATH . '/config/app.php';
            $msg = $app['debug'] ? $e->getMessage() : 'Error de conexión a la base de datos.';
            throw new RuntimeException($msg, 500, $e);
        }
    }

    public static function getInstance(): self
    {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * Ejecuta una consulta preparada y devuelve el PDOStatement.
     *
     * @param  string  $sql    Consulta con marcadores :nombre
     * @param  array   $params [':nombre' => $valor, ...]
     */
    public function query(string $sql, array $params = []): \PDOStatement
    {
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt;
    }

    /**
     * Devuelve el ID del último registro insertado.
     */
    public function lastInsertId(): string
    {
        return $this->pdo->lastInsertId();
    }

    public function beginTransaction(): void
    {
        $this->pdo->beginTransaction();
    }

    public function commit(): void
    {
        $this->pdo->commit();
    }

    public function rollBack(): void
    {
        $this->pdo->rollBack();
    }

    /** Impedir clonación y deserialización */
    private function __clone() {}
    public function __wakeup(): never
    {
        throw new RuntimeException('Database no puede ser deserializado.');
    }
}
