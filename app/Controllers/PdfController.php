<?php

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Models\AtencionModel;
use App\Models\CajaModel;
use App\Models\CitaModel;
use App\Models\ConsultasModel;
use Mpdf\HTMLParserMode;
use Mpdf\Mpdf;

class PdfController
{
    private AtencionModel $atenciones;
    private CajaModel $caja;
    private CitaModel $citas;
    private ConsultasModel $consultas;

    public function __construct()
    {
        $this->atenciones = new AtencionModel();
        $this->caja = new CajaModel();
        $this->citas = new CitaModel();
        $this->consultas = new ConsultasModel();
    }

    public function receta(Request $request): void
    {
        $idAtencion = (int) $request->param('id', 0);
        if ($idAtencion <= 0) {
            Response::json(['error' => 'Atencion invalida.'], 422);
        }

        $html = $this->renderReceta($this->atenciones->obtenerTratamiento($idAtencion));

        $this->streamPdf($html, 'Receta.pdf', [
            'mode' => 'utf-8',
            'format' => [140, 190],
        ]);
    }

    public function ticket(Request $request): void
    {
        $idCita = (int) $request->param('id', 0);
        if ($idCita <= 0) {
            Response::json(['error' => 'Cita invalida.'], 422);
        }

        $cita = $this->citas->find($idCita);
        if ($cita === null) {
            Response::json(['error' => 'Cita no encontrada.'], 404);
        }

        $html = $this->renderTicket($idCita, $cita, $this->caja->findMovimientoPorCita($idCita));

        $this->streamPdf($html, 'Ticket.pdf', [
            'mode' => 'utf-8',
            'format' => [80, 150],
            'margin_left' => 3,
            'margin_right' => 3,
            'margin_top' => 12,
            'margin_bottom' => 10,
            'margin_header' => 10,
        ]);
    }

    public function movimientos(Request $request): void
    {
        $tipo = strtoupper((string) $request->get('tipomovimiento', 'INGRESO'));
        $fecha1 = (string) $request->get('fecha1', '');
        $fecha2 = (string) $request->get('fecha2', '');

        if (!in_array($tipo, ['INGRESO', 'GASTO'], true) || !$this->isDate($fecha1) || !$this->isDate($fecha2)) {
            Response::json(['error' => 'Filtros de reporte invalidos.'], 422);
        }

        $movimientos = $this->consultas->reporteCantidades([
            'tipomovimientocaja' => $tipo,
            'fecha1' => $fecha1 . ' 00:00:00',
            'fecha2' => $fecha2 . ' 23:59:59',
        ]);

        $html = $this->renderReporteMovimientos($movimientos, $tipo, $fecha1, $fecha2);

        $this->streamPdf($html, 'Reporte.pdf', [
            'mode' => 'utf-8',
            'format' => 'A4',
        ]);
    }

    public function externos(Request $request): void
    {
        $fecha1 = (string) $request->get('fecha1', '');
        $fecha2 = (string) $request->get('fecha2', '');
        $establecimiento = (int) $request->get('establecimiento', 0);

        if (!$this->isDate($fecha1) || !$this->isDate($fecha2)) {
            Response::json(['error' => 'Filtros de reporte invalidos.'], 422);
        }

        $citas = $establecimiento > 0
            ? $this->citas->filtrarCitasExternas([
                'fecha1' => $fecha1,
                'fecha2' => $fecha2,
                'establecimiento' => $establecimiento,
            ])
            : $this->citas->listarCitasExternas($fecha1, $fecha2);

        $html = $this->renderReporteExternos($citas, $fecha1, $fecha2);

        $this->streamPdf($html, 'ReporteExt.pdf', [
            'mode' => 'utf-8',
            'format' => 'A4',
        ]);
    }

    private function streamPdf(string $html, string $filename, array $config): void
    {
        $mpdf = new Mpdf($config);
        $mpdf->WriteHTML($this->pdfCss(), HTMLParserMode::HEADER_CSS);
        $mpdf->WriteHTML($html, HTMLParserMode::HTML_BODY);
        $mpdf->Output($filename, 'I');
        exit;
    }

    private function renderReceta(array $tratamiento): string
    {
        $rows = '';
        foreach ($tratamiento as $item) {
            $medicamento = trim((string) ($item['nombre'] ?? ''));
            $rows .= '<tr><td>' . $this->e($medicamento) . '</td><td>' . $this->e($item['indicaciones'] ?? '') . '</td></tr>';
        }

        if ($rows === '') {
            $rows = '<tr><td colspan="2" class="ta-center">Sin tratamiento registrado.</td></tr>';
        }

        return '<body>
            <p id="titulo_receta">r</p>
            <div class="cont-tabla cont-receta">
                <table>
                    <thead><tr><th>Medicamento</th><th>Indicacion</th></tr></thead>
                    <tbody>' . $rows . '</tbody>
                </table>
            </div>
        </body>';
    }

    private function renderTicket(int $idCita, array $cita, ?array $movimiento): string
    {
        $logo = $this->assetPath('img/logoticket2.png');
        $monto = number_format((float) ($movimiento['monto'] ?? 0), 2);

        return '<body class="bodyticket">
            <div class="cont-ticket">
                <div class="cont-imgticket"><img src="' . $this->e($logo) . '"></div>
                <div>
                    <div class="infoticket">
                        <p>Francisco Cabrera Nro 419 2do Piso<br>
                        Chiclayo<br>
                        Tel: (074) 618 329<br>
                        Cel: 973 995 974<br>' . date('d-m-Y H:i:s') . '</p>
                        <p class="nrocita">Nro CITA : ' . $idCita . '</p>
                    </div>
                    <div class="cuerpoticket">
                        <div class="linea"></div>
                        <p class="apartado">DATOS DE PACIENTE :</p>
                        <div class="linea"></div>
                        <p><span>PACIENTE : </span> ' . $this->e(($cita['apellidospaciente'] ?? '') . ', ' . ($cita['nombrepaciente'] ?? '')) . '</p>
                        <p><span>NRO DOC : </span> ' . $this->e($cita['dni'] ?? '') . '</p>
                        <div class="linea"></div>
                        <p class="apartado">DATOS DE CITA :</p>
                        <div class="linea"></div>
                        <p><span>FECHA CITA : </span> ' . $this->e($cita['fecha'] ?? '') . '</p>
                        <p><span>HORA CITA : </span> ' . $this->e($cita['horario'] ?? '') . '</p>
                        <p><span>MOTIVO : </span> ' . $this->e($cita['motivo'] ?? '') . '</p>
                        <p><span>PRECIO : </span> ' . $this->e($cita['precio_consulta'] ?? '') . '</p>
                        <p><span>A CUENTA : </span> ' . $monto . '</p>
                    </div>
                    <div class="linea"></div>
                    <div class="infoticket"><p>Este no es un comprobante de Pago.<br>Gracias por su gentil preferencia</p></div>
                </div>
            </div>
        </body>';
    }

    private function renderReporteMovimientos(array $movimientos, string $tipo, string $fecha1, string $fecha2): string
    {
        $totales = ['EFECTIVO' => 0.0, 'TRANSFERENCIA' => 0.0, 'YAPE' => 0.0, 'POS' => 0.0];
        $rows = '';
        $cont = 1;

        foreach ($movimientos as $movimiento) {
            $cita = ((int) ($movimiento['codigoreferencia'] ?? 0)) > 0
                ? $this->citas->find((int) $movimiento['codigoreferencia'])
                : null;
            $paciente = $cita ? (($cita['apellidospaciente'] ?? '') . ', ' . ($cita['nombrepaciente'] ?? '')) : '-';
            $tipoMovimiento = (string) ($movimiento['tipomovimientocaja'] ?? '');
            $anulado = in_array($tipoMovimiento, ['A-INGRESO', 'A-GASTO'], true);
            $tipoPago = (string) ($movimiento['tipopago'] ?? '');
            $monto = (float) ($movimiento['monto'] ?? 0);

            if (!$anulado && array_key_exists($tipoPago, $totales)) {
                $totales[$tipoPago] += $monto;
            }

            $rows .= '<tr>
                <td class="ta-center">' . $cont . '</td>
                <td class="ta-center">' . $this->e($movimiento['fecha'] ?? '') . '</td>
                <td class="ta-center">' . $this->e($paciente) . '</td>
                <td class="ta-center">' . $this->e($movimiento['descripcion'] ?? '') . '</td>
                <td class="ta-center">' . number_format($monto, 2) . '</td>
                <td class="ta-center">' . $this->e($tipoPago) . '</td>
                <td class="ta-center">' . $this->e($movimiento['nick'] ?? '') . '</td>
                <td class="ta-center lnk-red">' . ($anulado ? 'ANULADO' : '') . '</td>
            </tr>';
            $cont++;
        }

        if ($rows === '') {
            $rows = '<tr><td colspan="8" class="ta-center">Sin movimientos en el periodo.</td></tr>';
        }

        $logo = $this->assetPath('img/logoticket2.png');
        $titulo = 'REPORTE DE ' . $tipo . 'S DEL ' . date('d/m/Y', strtotime($fecha1)) . ' AL ' . date('d/m/Y', strtotime($fecha2));

        return '<body>
            <h3 class="titulo-report">' . $this->e($titulo) . '</h3>
            <div class="resumen-report">
                <table><tr>
                    <td><img class="report-logo" src="' . $this->e($logo) . '"></td>
                    <td>
                        <table class="tbresumen">
                            <thead><tr><th colspan="2">Resumen</th></tr></thead>
                            <tbody>
                                <tr><td>Efectivo</td><td class="monto">' . number_format($totales['EFECTIVO'], 2) . '</td></tr>
                                <tr><td>Transferencia</td><td class="monto">' . number_format($totales['TRANSFERENCIA'], 2) . '</td></tr>
                                <tr><td>Yape</td><td class="monto">' . number_format($totales['YAPE'], 2) . '</td></tr>
                                <tr><td>POS</td><td class="monto">' . number_format($totales['POS'], 2) . '</td></tr>
                                <tr><td>Plin</td><td class="monto">0.00</td></tr>
                            </tbody>
                        </table>
                    </td>
                </tr></table>
            </div>
            <table class="tbreport-pdf">
                <thead><tr>
                    <th>#</th><th>Fecha</th><th>Paciente</th><th>Motivo</th>
                    <th>Monto</th><th>Tipo</th><th>Usuario</th><th>Estado</th>
                </tr></thead>
                <tbody>' . $rows . '</tbody>
            </table>
        </body>';
    }

    private function renderReporteExternos(array $citas, string $fecha1, string $fecha2): string
    {
        $rows = '';
        $total = 0.0;

        foreach ($citas as $cita) {
            $precio = (float) ($cita['precio'] ?? 0);
            if (($cita['estado'] ?? '') !== 'ANULADO') {
                $total += $precio;
            }

            $rows .= '<tr>
                <td class="ta-center">' . $this->e($cita['hora'] ?? '') . '</td>
                <td class="ta-center">' . $this->e($cita['fecha'] ?? '') . '</td>
                <td class="ta-center">' . $this->e($cita['establecimiento'] ?? '') . '</td>
                <td class="ta-center">' . $this->e($cita['motivo'] ?? '') . '</td>
                <td class="ta-center">' . number_format($precio, 2) . '</td>
            </tr>';
        }

        if ($rows === '') {
            $rows = '<tr><td colspan="5" class="ta-center">NO HAY PERSONAS CITADAS</td></tr>';
        }

        $rows .= '<tr><td class="rep_total" colspan="5"> TOTAL : ' . number_format($total, 2) . '</td></tr>';

        return '<body>
            <h4>Reporte del ' . $this->e($fecha1) . ' al ' . $this->e($fecha2) . '</h4>
            <div class="cont-tabla">
                <table class="tbreportespdf">
                    <thead>
                        <tr>
                            <th>Horario</th>
                            <th>Fecha</th>
                            <th>Establecimiento</th>
                            <th>Procedimiento</th>
                            <th>Precio</th>
                        </tr>
                    </thead>
                    <tbody>' . $rows . '</tbody>
                </table>
            </div>
        </body>';
    }

    private function pdfCss(): string
    {
        $path = PUBLIC_PATH . '/assets/css/estilos.css';
        return is_file($path) ? (string) file_get_contents($path) : '';
    }

    private function assetPath(string $relative): string
    {
        return str_replace('\\', '/', PUBLIC_PATH . '/assets/' . ltrim($relative, '/'));
    }

    private function isDate(string $date): bool
    {
        $parsed = date_create_from_format('Y-m-d', $date);
        return $parsed !== false && $parsed->format('Y-m-d') === $date;
    }

    private function e(mixed $value): string
    {
        return htmlspecialchars((string) $value, ENT_QUOTES, 'UTF-8');
    }
}
