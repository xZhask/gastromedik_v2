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
        return $this->db->query('SELECT idcargo, nombre FROM cargo ORDER BY nombre ASC')->fetchAll() ?: [];
    }

    public function findCargoById(int $idcargo): ?array
    {
        $row = $this->db->query(
            'SELECT idcargo, nombre FROM cargo WHERE idcargo = :idcargo',
            [':idcargo' => $idcargo]
        )->fetch() ?: [];

        return $row ?: null;
    }

    public function findCargoByNombre(string $nombre): ?array
    {
        $row = $this->db->query(
            'SELECT idcargo, nombre FROM cargo WHERE UPPER(nombre) = UPPER(:nombre) LIMIT 1',
            [':nombre' => $nombre]
        )->fetch() ?: [];

        return $row ?: null;
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
                    u.nombre,
                    u.apellidos,
                    u.nick,
                    c.idcargo,
                    c.nombre AS cargo,
                    u.estado
               FROM usuario u
               INNER JOIN cargo c ON c.idcargo = u.idcargo
              ORDER BY u.apellidos ASC, u.nombre ASC'
        )->fetchAll() ?: [];
    }

    public function findByDni(string $dni): ?array
    {
        $row = $this->db->query(
            'SELECT u.dni,
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

    public function findByNick(string $nick): ?array
    {
        $row = $this->db->query(
            'SELECT dni, nick FROM usuario WHERE UPPER(nick) = UPPER(:nick) LIMIT 1',
            [':nick' => $nick]
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

    public function actualizarPassword(string $dni, string $hashPass): bool
    {
        $stmt = $this->db->query(
            'UPDATE usuario SET pass = :pass WHERE dni = :dni',
            [':pass' => $hashPass, ':dni' => $dni]
        );
        return $stmt->rowCount() > 0;
    }
}
