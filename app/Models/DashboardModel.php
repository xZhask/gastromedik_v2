<?php

namespace App\Models;

use App\Core\Base\BaseModel;

class DashboardModel extends BaseModel
{
    /**
     * Obtiene los KPIs principales (Pacientes del mes, Citas hoy, Ingresos hoy)
     */
    public function getKpis(): array
    {
        // Total pacientes registrados (histórico completo, ya que no hay fecha_registro)
        $sqlPacientes = "SELECT COUNT(*) as total FROM paciente";
        $pacientes = $this->db->query($sqlPacientes)->fetch()['total'] ?? 0;

        // Citas agendadas para hoy
        $sqlCitas = "SELECT COUNT(*) as total FROM cita WHERE fecha = CURDATE() AND estado != 'ANULADA'";
        $citas = $this->db->query($sqlCitas)->fetch()['total'] ?? 0;

        // Ingresos de hoy
        $sqlIngresos = "SELECT SUM(monto) as total FROM movimientocaja WHERE tipomovimientocaja = 'INGRESO' AND DATE(fecha) = CURDATE()";
        $ingresos = $this->db->query($sqlIngresos)->fetch()['total'] ?? 0;

        // Atenciones completadas hoy
        $sqlAtenciones = "SELECT COUNT(*) as total FROM atencion WHERE DATE(fechaatencion) = CURDATE() AND estado = 'FINALIZADO'";
        $atenciones = $this->db->query($sqlAtenciones)->fetch()['total'] ?? 0;

        return [
            'pacientes_mes' => (int) $pacientes,
            'citas_hoy' => (int) $citas,
            'ingresos_hoy' => (float) $ingresos,
            'atenciones_hoy' => (int) $atenciones
        ];
    }

    /**
     * Obtiene los ingresos y egresos agrupados por día de los últimos X días
     */
    public function getFinanzas(int $dias = 7): array
    {
        $sql = "SELECT DATE(fecha) as fecha,
                       SUM(CASE WHEN tipomovimientocaja = 'INGRESO' THEN monto ELSE 0 END) as ingresos,
                       SUM(CASE WHEN tipomovimientocaja = 'GASTO' THEN monto ELSE 0 END) as egresos
                FROM movimientocaja
                WHERE fecha >= DATE_SUB(CURDATE(), INTERVAL :dias DAY)
                GROUP BY DATE(fecha)
                ORDER BY fecha ASC";
                
        return $this->db->query($sql, [':dias' => $dias])->fetchAll() ?: [];
    }

    /**
     * Obtiene los tipos de procedimientos más frecuentes de este mes
     */
    public function getProcedimientosTop(int $limit = 5): array
    {
        // Se inyecta $limit (que ya está casteado a int) directamente para evitar problemas con PDO y LIMIT
        $sql = "SELECT ta.nombre as procedimiento, COUNT(a.idatencion) as cantidad
                FROM atencion a
                INNER JOIN tipo_atencion ta ON a.idtipoatencion = ta.idtipoatencion
                WHERE MONTH(a.fechaatencion) = MONTH(CURDATE()) AND YEAR(a.fechaatencion) = YEAR(CURDATE())
                GROUP BY ta.idtipoatencion
                ORDER BY cantidad DESC
                LIMIT $limit";
                
        return $this->db->query($sql)->fetchAll() ?: [];
    }
}
