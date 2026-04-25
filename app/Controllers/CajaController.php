<?php

namespace App\Controllers;

use App\Core\Auth;
use App\Core\Request;
use App\Core\Response;
use App\Models\AtencionModel;
use App\Models\CajaModel;
use App\Models\CitaModel;
use App\Services\CajaService;

class CajaController
{
    private CajaModel     $caja;
    private CitaModel     $citas;
    private AtencionModel $atenciones;
    private CajaService   $cajaService;

    public function __construct()
    {
        $this->caja       = new CajaModel();
        $this->citas      = new CitaModel();
        $this->atenciones = new AtencionModel();
        $this->cajaService = new CajaService();
    }

    /** POST /api/caja/aperturar */
    public function aperturar(Request $request): void
    {
        $body  = $request->json();
        $fecha = date('Y/m/d H:i:s');
        $monto = $body['monto_inicial'] ?? '0';

        $this->caja->aperturar([
            'fecha_apertura' => $fecha,
            'monto_apertura' => $monto,
            'monto_cierre'   => 0.0,
        ]);

        $cajaDiaria = $this->caja->findCajaActiva();

        $this->caja->insertarMovimiento([
            'idtipopago'         => 1,
            'idcajadiaria'       => $cajaDiaria['idcajadiaria'],
            'tipomovimientocaja' => 'INGRESO',
            'descripcion'        => $body['descripcion'] ?? '',
            'monto'              => $monto,
            'codigoreferencia'   => 0,
            'fecha'              => $fecha,
            'idusuario'          => Auth::id(),
        ]);

        Response::json($cajaDiaria, 201);
    }

    /** POST /api/caja/cerrar */
    public function cerrar(Request $request): void
    {
        $body       = $request->json();
        $idcaja     = (int) ($body['idcajadiaria'] ?? 0);
        $cajaDiaria = $this->caja->findCajaActiva();

        $efectivo      = $this->caja->calcularEfectivo($idcaja, 'INGRESO');
        $gastos        = $this->caja->calcularTotal($idcaja, 'GASTO');
        $montoApertura = (float) ($cajaDiaria['monto_apertura'] ?? 0);
        $montoCierre   = $efectivo + $montoApertura - $gastos;

        $this->caja->cerrar([
            'idcajadiaria' => $idcaja,
            'fecha_cierre' => date('Y/m/d H:i:s'),
            'monto_cierre' => $montoCierre,
        ]);
        Response::json(['message' => 'Caja cerrada', 'monto_cierre' => $montoCierre]);
    }

    /** GET /api/caja/verificar */
    public function verificar(Request $request): void
    {
        $cajaDiaria = $this->caja->findCajaActiva();

        if ($cajaDiaria === null) {
            Response::json(['abierta' => false]);
            return;
        }

        Response::json(array_merge(['abierta' => true], $cajaDiaria));
    }

    /** POST /api/caja/gasto */
    public function registrarGasto(Request $request): void
    {
        $body       = $request->json();
        $cajaDiaria = $this->caja->findCajaActiva();

        $this->caja->insertarMovimiento([
            'idtipopago'         => 1,
            'idcajadiaria'       => $cajaDiaria['idcajadiaria'],
            'tipomovimientocaja' => 'GASTO',
            'descripcion'        => $body['descripcion'] ?? '',
            'monto'              => $body['monto'] ?? '0',
            'codigoreferencia'   => 0,
            'fecha'              => date('Y/m/d H:i:s'),
            'idusuario'          => Auth::id(),
        ]);

        Response::json(['message' => 'Gasto registrado'], 201);
    }

    /** GET /api/caja/gastos?idcajadiaria= */
    public function gastos(Request $request): void
    {
        $idcaja = (int) $request->get('idcajadiaria', 0);
        $filas  = $this->caja->listarGastos($idcaja);

        $data = array_map(fn($f) => [
            'idmovimientocaja' => (int) $f['idmovimientocaja'],
            'fecha'            => $f['fecha'],
            'descripcion'      => $f['descripcion'],
            'monto'            => $f['monto'],
            'nick'             => $f['nick'],
        ], $filas);

        Response::json($data);
    }

    /** GET /api/caja/ultimos-ingresos?idcajadiaria= */
    public function ultimosIngresos(Request $request): void
    {
        $idcaja = (int) $request->get('idcajadiaria', 0);
        $filas  = $this->caja->listarUltimosIngresos($idcaja);

        $data = array_map(fn($f) => [
            'idmovimientocaja' => (int) $f['idmovimientocaja'],
            'fecha'            => $f['fecha'],
            'descripcion'      => $f['descripcion'],
            'monto'            => $f['monto'],
            'nick'             => $f['nick'],
            'tipopago'         => $f['tipopago'],
        ], $filas);

        Response::json($data);
    }

    /** GET /api/caja/montos?idcajadiaria= */
    public function montos(Request $request): void
    {
        $idcaja     = (int) $request->get('idcajadiaria', 0);
        $cajaDiaria = $this->caja->findCajaActiva();

        $efectivo      = $this->caja->calcularEfectivo($idcaja, 'INGRESO');
        $gastos        = $this->caja->calcularTotal($idcaja, 'GASTO');
        $totalUtilidad = $this->caja->calcularTotal($idcaja, 'INGRESO');
        $otrosIngresos = $this->caja->calcularOtrosIngresos($cajaDiaria['fecha_apertura'] ?? '');
        $montoApertura = (float) ($cajaDiaria['monto_apertura'] ?? 0);

        Response::json([
            'efectivo'       => $efectivo,
            'gastos'         => $gastos,
            'total_utilidad' => $totalUtilidad,
            'monto_apertura' => $montoApertura,
            'total_caja'     => $efectivo + $montoApertura - $gastos,
            'otros_ingresos' => array_map(fn($f) => [
                'tipopago' => $f['tipopago'],
                'suma'     => $f['suma'],
            ], $otrosIngresos),
        ]);
    }

    /** POST /api/caja/pago */
    public function registrarPago(Request $request): void
    {
        $resultado = $this->cajaService->registrarPago($request->json(), Auth::id());
        Response::json($resultado, 201);
    }

    /** GET /api/caja/movimiento-cuenta?idcita= */
    public function movimientoCuenta(Request $request): void
    {
        $idcita     = (int) $request->get('idcita', 0);
        Response::json(['monto' => $this->caja->sumarIngresosPorCita($idcita)]);
    }
}
