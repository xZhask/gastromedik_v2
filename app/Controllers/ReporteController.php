<?php

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Models\CitaModel;
use App\Models\ConsultasModel;

class ReporteController
{
    private ConsultasModel $consultas;
    private CitaModel      $citas;

    public function __construct()
    {
        $this->consultas = new ConsultasModel();
        $this->citas     = new CitaModel();
    }

    /** GET /api/reportes/movimientos?tipomovimientocaja=&fecha1=&fecha2= */
    public function movimientos(Request $request): void
    {
        $filtro = [
            'tipomovimientocaja' => $request->get('tipomovimientocaja', ''),
            'fecha1'             => $request->get('fecha1', '') . ' 00:00:00',
            'fecha2'             => $request->get('fecha2', '') . ' 23:59:59',
        ];

        $filas = $this->consultas->reporteCantidades($filtro);

        $data = array_map(function ($f) {
            $tipomovimiento   = $f['tipomovimientocaja'];
            $codigoreferencia = (int) $f['codigoreferencia'];
            $paciente         = '-';

            if ($codigoreferencia > 0) {
                $cita = $this->citas->find($codigoreferencia);
                if ($cita !== null) {
                    $paciente = $cita['apellidospaciente'] . ', ' . $cita['nombrepaciente'];
                }
            }

            $anulado = in_array($tipomovimiento, ['A-INGRESO', 'A-GASTO']);

            return [
                'idmovimientocaja' => (int) $f['idmovimientocaja'],
                'fecha'            => $f['fecha'],
                'paciente'         => $paciente,
                'descripcion'      => $f['descripcion'],
                'monto'            => $f['monto'],
                'tipopago'         => $f['tipopago'],
                'nick'             => $f['nick'],
                'anulado'          => $anulado,
            ];
        }, $filas);

        Response::json($data);
    }

    /** GET /api/reportes/kardex?idproducto=&fecha1=&fecha2= */
    public function kardex(Request $request): void
    {
        $datos = [
            'idproducto' => (int) $request->get('idproducto', 0),
            'fecha1'     => $request->get('fecha1', '') . ' 00:00:00',
            'fecha2'     => $request->get('fecha2', '') . ' 23:59:59',
        ];

        $filas         = $this->consultas->kardex($datos);
        $totalIngresos = $this->consultas->cantidadKardexAnterior($datos, 'I');
        $totalSalidas  = $this->consultas->cantidadKardexAnterior($datos, 'S');
        $saldo         = $totalIngresos - $totalSalidas;

        $rows = [];
        foreach ($filas as $f) {
            $cantidad = (float) $f['cantidad'];
            $tipo     = $f['tipomovimiento'];

            if ($tipo === 'I') {
                $ingreso = $cantidad;
                $salida  = null;
                $saldo  += $cantidad;
            } else {
                $ingreso = null;
                $salida  = $cantidad;
                $saldo  -= $cantidad;
            }

            $rows[] = [
                'fecha'       => $f['fecha'],
                'descripcion' => $f['descripcion'],
                'nick'        => $f['nick'],
                'ingreso'     => $ingreso,
                'salida'      => $salida,
                'saldo'       => $saldo,
            ];
        }

        Response::json($rows);
    }
}
