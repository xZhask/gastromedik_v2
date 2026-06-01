<?php

namespace App\Models;

use App\Core\Base\BaseModel;
use PDOStatement;

class AtencionModel extends BaseModel
{
    public function findPorCita(int $idcita): ?array
    {
        $sql = "SELECT a.*, p.nombre, p.apellidos
                FROM atencion a
                INNER JOIN movimientocaja mc ON a.idmovimiento = mc.idmovimientocaja
                INNER JOIN paciente p ON a.idpaciente = p.dni
                WHERE mc.codigoreferencia = :idcita
                ORDER BY a.idatencion ASC
                LIMIT 1";

        return $this->fetch($this->db->query($sql, [':idcita' => $idcita]));
    }

    public function listarPendientes(): array
    {
        $sql = "SELECT a.idatencion, a.idpaciente, p.nombre, p.apellidos, a.estado
                FROM atencion a
                INNER JOIN paciente p ON a.idpaciente = p.dni
                WHERE a.estado = 'INICIADO'
                ORDER BY a.idatencion ASC";

        return $this->fetchAll($this->db->query($sql));
    }

    public function listarPorFecha(string $fecha): array
    {
        $sql = "SELECT a.idatencion, a.idpaciente, a.motivoconsulta,
                       a.estado, a.fechaatencion,
                       p.nombre, p.apellidos
                FROM atencion a
                INNER JOIN paciente p ON a.idpaciente = p.dni
                WHERE DATE(a.fechaatencion) = :fecha
                ORDER BY a.fechaatencion DESC";

        return $this->fetchAll($this->db->query($sql, [':fecha' => $fecha]));
    }

    public function listarPorPaciente(string $dni): array
    {
        $sql = "SELECT a.idatencion, a.fechaatencion, a.motivoconsulta, a.estado
                FROM atencion a
                WHERE a.idpaciente = :dni
                ORDER BY a.fechaatencion DESC";

        return $this->fetchAll($this->db->query($sql, [':dni' => $dni]));
    }

    public function listarHistorial(string $dni): array
    {
        $sql = "SELECT idatencion, fechaatencion, motivoconsulta, diagnostico, tratamiento
                FROM atencion
                WHERE idpaciente = :dni
                  AND estado = 'FINALIZADO'
                ORDER BY fechaatencion DESC";

        return $this->fetchAll($this->db->query($sql, [':dni' => $dni]));
    }

    public function obtenerPorId(int $id): ?array
    {
        $sql = "SELECT a.*, p.nombre, p.apellidos, a.idpaciente AS dni
                FROM atencion a
                INNER JOIN paciente p ON a.idpaciente = p.dni
                WHERE a.idatencion = :id";

        return $this->fetch($this->db->query($sql, [':id' => $id]));
    }

    public function obtenerConDetalles(int $id): ?array
    {
        $sql = "SELECT a.*,
                       a.idpaciente AS dni,
                       CONCAT(p.nombre, ' ', p.apellidos) AS paciente,
                       TIMESTAMPDIFF(YEAR, p.fecha_nac, CURDATE()) AS edad,
                       ta.nombre AS tipo_consulta,
                       sv.fr, sv.pa, sv.temp, sv.so2, sv.peso
                FROM atencion a
                INNER JOIN paciente p ON a.idpaciente = p.dni
                LEFT JOIN tipo_atencion ta ON a.idtipoatencion = ta.idtipoatencion
                LEFT JOIN signosvitales sv ON a.idatencion = sv.idatencion
                WHERE a.idatencion = :id";

        return $this->fetch($this->db->query($sql, [':id' => $id]));
    }

    public function actualizar(int $id, array $data): PDOStatement
    {
        $sql = "UPDATE atencion SET
                    motivoconsulta = :motivoconsulta,
                    antecedente = :antecedente,
                    anamensis = :anamensis,
                    exfisico = :exfisico,
                    diagnostico = :diagnostico,
                    tratamiento = :tratamiento,
                    estado = :estado,
                    fechaatencion = :fechaatencion
                WHERE idatencion = :id";

        return $this->db->query($sql, [
            ':id' => $id,
            ':motivoconsulta' => $data['motivoconsulta'] ?? '',
            ':antecedente' => $data['antecedente'] ?? '',
            ':anamensis' => $data['anamensis'] ?? '',
            ':exfisico' => $data['exfisico'] ?? '',
            ':diagnostico' => $data['diagnostico'] ?? '',
            ':tratamiento' => $data['tratamiento'] ?? '',
            ':estado' => $data['estado'] ?? 'INICIADO',
            ':fechaatencion' => $data['fechaatencion'] ?? null,
        ]);
    }

    public function registrar(array $data): PDOStatement
    {
        $sql = "INSERT INTO atencion
                    (idpaciente, idtipoatencion, idmovimiento, idusuario,
                     fechaatencion, motivoconsulta, antecedente, anamensis,
                     exfisico, diagnostico, tratamiento, examen, estado)
                VALUES
                    (:idpaciente, :idtipoatencion, :idmovimiento, :idusuario,
                     :fechaatencion, :motivoconsulta, :antecedente, :anamensis,
                     :exfisico, :diagnostico, :tratamiento, :examen, :estado)";

        return $this->db->query($sql, [
            ':idpaciente'     => $data['idpaciente'],
            ':idtipoatencion' => $data['idtipoatencion'],
            ':idmovimiento'   => $data['idmovimiento'],
            ':idusuario'      => $data['idusuario'],
            ':fechaatencion'  => $data['fechaatencion'] ?? null,
            ':motivoconsulta' => $data['motivoconsulta'] ?? '-',
            ':antecedente'    => $data['antecedente'] ?? '-',
            ':anamensis'      => $data['anamensis'] ?? '-',
            ':exfisico'       => $data['exfisico'] ?? '-',
            ':diagnostico'    => $data['diagnostico'] ?? '-',
            ':tratamiento'    => $data['tratamiento'] ?? '-',
            ':examen'         => $data['examen'] ?? '-',
            ':estado'         => $data['estado'] ?? 'INICIADO',
        ]);
    }

    public function findPorMovimiento(int $idmovimiento): ?array
    {
        $sql = "SELECT a.*, p.nombre, p.apellidos
                FROM atencion a
                INNER JOIN paciente p ON a.idpaciente = p.dni
                WHERE a.idmovimiento = :idmovimiento
                LIMIT 1";

        return $this->fetch($this->db->query($sql, [':idmovimiento' => $idmovimiento]));
    }

    public function cancelar(int $id): PDOStatement
    {
        $sql = "UPDATE atencion SET estado = 'CANCELADO' WHERE idatencion = :id";
        return $this->db->query($sql, [':id' => $id]);
    }

    public function obtenerSignos(int $idAtencion): ?array
    {
        $sql = "SELECT * FROM signosvitales WHERE idatencion = :id";
        return $this->fetch($this->db->query($sql, [':id' => $idAtencion]));
    }

    public function guardarSignos(int $idAtencion, array $data): PDOStatement
    {
        $params = [
            ':idatencion' => $idAtencion,
            ':fr' => $data['fr'] ?? '',
            ':pa' => $data['pa'] ?? '',
            ':temp' => $data['temp'] ?? '',
            ':so2' => $data['so2'] ?? '',
            ':peso' => $data['peso'] ?? '',
        ];

        if ($this->obtenerSignos($idAtencion)) {
            $sql = "UPDATE signosvitales
                    SET fr = :fr,
                        pa = :pa,
                        temp = :temp,
                        so2 = :so2,
                        peso = :peso
                    WHERE idatencion = :idatencion";
        } else {
            $sql = "INSERT INTO signosvitales (idatencion, fr, pa, temp, so2, peso)
                    VALUES (:idatencion, :fr, :pa, :temp, :so2, :peso)";
        }

        return $this->db->query($sql, $params);
    }

    public function obtenerTratamiento(int $idAtencion): array
    {
        $sql = "SELECT t.idtratamiento, t.idmedicina, t.idatencion, t.indicaciones,
                       m.nombre, m.stock, m.tipoinsumo
                FROM tratamiento t
                INNER JOIN medicamento m ON t.idmedicina = m.idmedicina
                WHERE t.idatencion = :id
                ORDER BY t.idtratamiento ASC";

        return $this->fetchAll($this->db->query($sql, [':id' => $idAtencion]));
    }
}
