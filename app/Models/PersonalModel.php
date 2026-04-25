<?php

namespace App\Models;

use App\Core\Database;

class PersonalModel
{
    private Database $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    public function listarCargos(): array
    {
        return $this->db->query('SELECT * FROM cargo')->fetchAll() ?: [];
    }

    public function registrarCargo(string $nombre): bool
    {
        $stmt = $this->db->query(
            'INSERT INTO cargo(nombre) VALUES (:nombre)',
            [':nombre' => $nombre]
        );
        return $stmt->rowCount() > 0;
    }

    public function listar(): array
    {
        return $this->db->query(
            'SELECT u.dni,
                    concat_ws(", ", u.apellidos, u.nombre) AS nombre,
                    u.nick,
                    c.idcargo,
                    c.nombre AS cargo,
                    u.estado
               FROM usuario u
               INNER JOIN cargo c ON c.idcargo = u.idcargo'
        )->fetchAll() ?: [];
    }

    /** Obtiene datos completos de un usuario por DNI. Devuelve null si no existe. */
    public function findByDni(string $dni): ?array
    {
        $row = $this->db->query(
            'SELECT u.dni,
                    concat_ws(", ", u.apellidos, u.nombre) AS nombre_completo,
                    u.nombre,
                    u.apellidos,
                    u.nick,
                    c.idcargo,
                    c.nombre AS cargo,
                    u.estado
               FROM usuario u
               INNER JOIN cargo c ON c.idcargo = u.idcargo
              WHERE u.dni = :dni',
            [':dni' => $dni]
        )->fetch() ?: [];

        return $row ?: null;
    }

    public function registrar(array $usuario): bool
    {
        $stmt = $this->db->query(
            'INSERT INTO usuario(dni, nombre, apellidos, nick, pass, idcargo, estado)
             VALUES (:dni, :nombre, :apellidos, :nick, :pass, :idcargo, :estado)',
            [
                ':dni'       => $usuario['dni'],
                ':nombre'    => $usuario['nombre'],
                ':apellidos' => $usuario['apellidos'],
                ':nick'      => $usuario['nick'],
                ':pass'      => $usuario['pass'],
                ':idcargo'   => $usuario['idcargo'],
                ':estado'    => $usuario['estado'],
            ]
        );
        return $stmt->rowCount() > 0;
    }

    public function actualizar(array $usuario): bool
    {
        $stmt = $this->db->query(
            'UPDATE usuario
                SET nombre    = :nombre,
                    apellidos = :apellidos,
                    nick      = :nick,
                    idcargo   = :idcargo,
                    estado    = :estado
              WHERE dni = :dni',
            [
                ':dni'       => $usuario['dni'],
                ':nombre'    => $usuario['nombre'],
                ':apellidos' => $usuario['apellidos'],
                ':nick'      => $usuario['nick'],
                ':idcargo'   => $usuario['idcargo'],
                ':estado'    => $usuario['estado'],
            ]
        );
        return $stmt->rowCount() > 0;
    }

    /**
     * Actualiza el hash de contraseña de un usuario.
     * Recibe la contraseña ya hasheada con password_hash().
     */
    public function actualizarPassword(string $dni, string $hashPass): bool
    {
        $stmt = $this->db->query(
            'UPDATE usuario SET pass = :pass WHERE dni = :dni',
            [':pass' => $hashPass, ':dni' => $dni]
        );
        return $stmt->rowCount() > 0;
    }
}
