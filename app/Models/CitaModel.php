<?php

namespace App\Models;

use App\Core\Base\BaseModel;

class CitaModel extends BaseModel
{
    /** Lista citas en un rango de fechas para el calendario */
    public function listarEnRango(string $start, string $end): array
    {
        return $this->db->query(
            'SELECT c.idcita,
                    c.fecha,
                    c.horario,
                    p.dni,
                    concat_ws(", ", p.apellidos, p.nombre) AS paciente,
                    t.nombre  AS motivo,
                    c.estado
               FROM cita c
               INNER JOIN paciente p      ON p.dni = c.dni
               INNER JOIN tipo_atencion t ON t.idtipoatencion = c.motivo_consulta
              WHERE c.fecha >= :start AND c.fecha <= :end
              ORDER BY c.fecha, c.horario',
            [':start' => $start, ':end' => $end]
        )->fetchAll() ?: [];
    }

    /** Lista citas de una fecha concreta con datos de paciente y tipo de atención */
    public function listarPorFecha(string $fecha): array
    {
        return $this->db->query(
            'SELECT c.idcita,
                    c.fecha,
                    c.horario,
                    p.dni,
                    concat_ws(", ", p.apellidos, p.nombre) AS paciente,
                    t.nombre  AS motivo,
                    t.precio,
                    p.telefono,
                    c.estado
               FROM cita c
               INNER JOIN paciente p      ON p.dni = c.dni
               INNER JOIN tipo_atencion t ON t.idtipoatencion = c.motivo_consulta
              WHERE c.fecha = :fecha
              ORDER BY c.horario',
            [':fecha' => $fecha]
        )->fetchAll() ?: [];
    }

    /** Citas confirmadas (PAGADO o A CUENTA) de una fecha */
    public function listarConfirmadasHoy(string $fecha): array
    {
        return $this->db->query(
            'SELECT c.idcita,
                    p.dni,
                    c.horario,
                    concat_ws(", ", p.apellidos, p.nombre) AS paciente,
                    t.nombre  AS motivo,
                    t.precio,
                    p.telefono
               FROM cita c
               INNER JOIN paciente p      ON p.dni = c.dni
               INNER JOIN tipo_atencion t ON t.idtipoatencion = c.motivo_consulta
              WHERE c.fecha = :fecha
                AND (c.estado = :estado OR c.estado = "A CUENTA")
              ORDER BY c.horario',
            [':fecha' => $fecha, ':estado' => 'PAGADO']
        )->fetchAll() ?: [];
    }

    /** Citas pendientes de pago (A CUENTA o POR PAGAR) del último año */
    public function listarPendientes(): array
    {
        return $this->db->query(
            'SELECT c.idcita,
                    c.fecha,
                    c.horario,
                    concat_ws(", ", p.apellidos, p.nombre) AS paciente,
                    t.nombre  AS motivo,
                    t.precio,
                    p.telefono,
                    c.estado
               FROM cita c
               INNER JOIN paciente p      ON p.dni = c.dni
               INNER JOIN tipo_atencion t ON t.idtipoatencion = c.motivo_consulta
              WHERE (c.estado = "A CUENTA" OR c.estado = "POR PAGAR")
                AND c.fecha >= :fechapend
              ORDER BY c.fecha DESC',
            [':fechapend' => date('Y-m-d', strtotime('-1 year'))]
        )->fetchAll() ?: [];
    }

    /** Últimas 10 citas de un paciente */
    public function listarPorPaciente(string $dni): array
    {
        return $this->db->query(
            'SELECT c.idcita,
                    c.horario,
                    c.fecha,
                    tp.nombre AS motivo,
                    c.estado
               FROM cita c
               INNER JOIN tipo_atencion tp ON tp.idtipoatencion = c.motivo_consulta
              WHERE c.dni = :dni
              ORDER BY c.fecha DESC
              LIMIT 10',
            [':dni' => $dni]
        )->fetchAll() ?: [];
    }

    /** Busca citas "A CUENTA" de un paciente */
    public function buscarPendientesPorPaciente(string $dni): array
    {
        return $this->db->query(
            'SELECT * FROM cita WHERE estado = "A CUENTA" AND dni = :dni',
            [':dni' => $dni]
        )->fetchAll() ?: [];
    }

    /** Datos completos de una cita para edición/visualización */
    public function find(int $idcita): ?array
    {
        $row = $this->db->query(
            'SELECT c.idcita,
                    c.fecha,
                    c.horario,
                    p.dni,
                    YEAR(CURDATE()) - YEAR(p.fecha_nac) AS edad,
                    p.apellidos AS apellidospaciente,
                    p.nombre    AS nombrepaciente,
                    p.telefono,
                    t.idtipoatencion,
                    t.nombre    AS motivo,
                    CAST(c.precio_consulta AS DECIMAL(10,2)) as precio_consulta,
                    t.precio,
                    c.estado
               FROM cita c
               INNER JOIN paciente p      ON p.dni = c.dni
               INNER JOIN tipo_atencion t ON t.idtipoatencion = c.motivo_consulta
              WHERE c.idcita = :idcita',
            [':idcita' => $idcita]
        )->fetch(\PDO::FETCH_ASSOC);

        return $row ?: null;
    }


    public function registrar(array $cita): int
    {
        $this->db->query(
            'INSERT INTO cita(dni, fecha, horario, motivo_consulta, precio_consulta, estado)
             VALUES (:dni, :fecha, :horario, :motivo_consulta, :precio_consulta, :estado)',
            [
                ':dni'             => $cita['dni'],
                ':fecha'           => $cita['fecha'],
                ':horario'         => $cita['horario'],
                ':motivo_consulta' => $cita['motivo_consulta'],
                ':precio_consulta' => $cita['precio_consulta'],
                ':estado'          => $cita['estado'],
            ]
        );
        return (int) $this->db->lastInsertId();
    }

    public function actualizar(array $cita): bool
    {
        $stmt = $this->db->query(
            'UPDATE cita
                SET dni             = :dni,
                    fecha           = :fecha,
                    horario         = :horario,
                    motivo_consulta = :motivo_consulta,
                    precio_consulta = :precio_consulta
              WHERE idcita = :idcita',
            [
                ':idcita'          => $cita['idcita'],
                ':dni'             => $cita['dni'],
                ':fecha'           => $cita['fecha'],
                ':horario'         => $cita['horario'],
                ':motivo_consulta' => $cita['motivo_consulta'],
                ':precio_consulta' => $cita['precio_consulta'],
            ]
        );
        return $stmt->rowCount() > 0;
    }

    public function actualizarEstado(int $idcita, string $estado): bool
    {
        $stmt = $this->db->query(
            'UPDATE cita SET estado = :estado WHERE idcita = :idcita',
            [':idcita' => $idcita, ':estado' => $estado]
        );
        return $stmt->rowCount() > 0;
    }

    public function anular(int $idcita): bool
    {
        return $this->actualizarEstado($idcita, 'ANULADO');
    }

    // Citas externas

    public function registrarCitaExterna(array $cita): bool
    {
        $stmt = $this->db->query(
            'INSERT INTO trabajo_externo(paciente, idhospital, idtipoatencion, precio, fecha, hora, estado)
             VALUES (:paciente, :idhospital, :idtipoatencion, :precio, :fecha, :hora, :estado)',
            [
                ':paciente'       => $cita['paciente'],
                ':idhospital'     => $cita['idhospital'],
                ':idtipoatencion' => $cita['idtipoatencion'],
                ':precio'         => $cita['precio'],
                ':fecha'          => $cita['fecha'],
                ':hora'           => $cita['hora'],
                ':estado'         => $cita['estado'],
            ]
        );
        return $stmt->rowCount() > 0;
    }

    public function listarCitasExternas(string $fecha1, string $fecha2): array
    {
        return $this->db->query(
            'SELECT te.paciente,
                    te.idtrabajoexterno,
                    te.fecha,
                    te.hora,
                    concat_ws(" ", te.fecha, te.hora) AS fechacita,
                    ce.nombre AS establecimiento,
                    t.nombre  AS motivo,
                    te.precio,
                    te.estado
               FROM trabajo_externo te
               INNER JOIN tipo_atencion       t  ON t.idtipoatencion = te.idtipoatencion
               INNER JOIN consultorios_externos ce ON ce.idhospital  = te.idhospital
              WHERE te.fecha >= :fecha1
                AND te.fecha <= :fecha2
              ORDER BY fechacita',
            [':fecha1' => $fecha1, ':fecha2' => $fecha2]
        )->fetchAll() ?: [];
    }

    public function filtrarCitasExternas(array $datos): array
    {
        return $this->db->query(
            'SELECT te.paciente,
                    te.idtrabajoexterno,
                    te.fecha,
                    te.hora,
                    concat_ws(" ", te.fecha, te.hora) AS fechacita,
                    ce.nombre AS establecimiento,
                    t.nombre  AS motivo,
                    te.precio,
                    te.estado
               FROM trabajo_externo te
               INNER JOIN tipo_atencion       t  ON t.idtipoatencion = te.idtipoatencion
               INNER JOIN consultorios_externos ce ON ce.idhospital  = te.idhospital
              WHERE te.fecha >= :fecha1
                AND te.fecha <= :fecha2
                AND ce.idhospital = :establecimiento
              ORDER BY fechacita',
            [
                ':fecha1'         => $datos['fecha1'],
                ':fecha2'         => $datos['fecha2'],
                ':establecimiento'=> $datos['establecimiento'],
            ]
        )->fetchAll() ?: [];
    }

    public function anularCitaExterna(int $id): bool
    {
        $stmt = $this->db->query(
            'DELETE FROM trabajo_externo WHERE idtrabajoexterno = :id',
            [':id' => $id]
        );
        return $stmt->rowCount() > 0;
    }

    // ── Reportes ─────────────────────────────────────────────────────────────

    public function listarTipoAtencionesPorFecha(string $fecha1, string $fecha2): array
    {
        return $this->db->query(
            'SELECT ta.nombre AS tipo_atencion,
                    COUNT(c.motivo_consulta) AS cantidad
               FROM cita c
               INNER JOIN tipo_atencion ta ON c.motivo_consulta = ta.idtipoatencion
              WHERE c.fecha >= :fecha1
                AND c.fecha <= :fecha2
              GROUP BY ta.nombre
              ORDER BY 2 DESC',
            [':fecha1' => $fecha1, ':fecha2' => $fecha2]
        )->fetchAll() ?: [];
    }

    public function filtrarTipoAtenciones(array $datos): array
    {
        return $this->db->query(
            'SELECT ta.nombre AS tipo_atencion,
                    COUNT(c.motivo_consulta) AS cantidad
               FROM cita c
               INNER JOIN tipo_atencion ta ON c.motivo_consulta = ta.idtipoatencion
              WHERE c.fecha >= :fecha1
                AND c.fecha <= :fecha2
                AND c.motivo_consulta = :tipoAtencion
              GROUP BY ta.nombre',
            [
                ':fecha1'      => $datos['fecha1'],
                ':fecha2'      => $datos['fecha2'],
                ':tipoAtencion'=> $datos['tipoAtencion'],
            ]
        )->fetchAll() ?: [];
    }
}

