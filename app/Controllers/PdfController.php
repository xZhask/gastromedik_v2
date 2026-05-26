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
            'format' => [80, 200],
            'margin_top' => 6,
            'margin_bottom' => 6,
            'margin_header' => 0,
            'margin_footer' => 0,
            'margin_left' => 4,
            'margin_right' => 4,
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
        // Crear carpeta temporal
        $tempDir = STORAGE_PATH . DIRECTORY_SEPARATOR . 'pdf-temp';
        if (!is_dir($tempDir)) {
            @mkdir($tempDir, 0777, true);
        }
        
        $config['tempDir'] = $tempDir;
        $config['allow_remote_files'] = false;

        $mpdf = new Mpdf($config);
        $mpdf->WriteHTML($this->pdfCss(), HTMLParserMode::HEADER_CSS);
        $mpdf->WriteHTML($html, HTMLParserMode::HTML_BODY);

        while (ob_get_level() > 0) {
            ob_end_clean();
        }

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
        $logo  = $this->assetPath('img/logo-gm.svg');
        $monto = $this->caja->sumarIngresosPorCita($idCita);
        $precio = (float) ($cita['precio_consulta'] ?? 0);
        $saldo  = max(0, $precio - $monto);
        $tipoPago = strtoupper((string) ($movimiento['tipopago'] ?? 'EFECTIVO'));
        $estadoPago = $saldo > 0 ? 'A CUENTA' : 'PAGADO';

        $paciente  = trim(($cita['apellidospaciente'] ?? '') . ', ' . ($cita['nombrepaciente'] ?? ''), ', ');
        $fechaHora = date('d/m/Y H:i');
        
        $fechaCitaStr = ($cita['fecha'] ?? '') . ' ' . ($cita['horario'] ?? '00:00:00');
        $isFuture = strtotime($fechaCitaStr) > time();

        return '<body class="bodyticket">
            <div class="ticket">

                <header class="ticket-head" style="text-align: left; margin-bottom: 10px;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="width: 40px; vertical-align: middle; padding: 0;">
                                <img src="' . $this->e($logo) . '" style="width: 35px; height: auto;">
                            </td>
                            <td style="vertical-align: middle; padding-left: 8px;">
                                <h1 style="margin: 0; font-size: 14px; font-weight: bold; color: #111;">GASTRO-MEDIK</h1>
                                <p style="margin: 3px 0 0 0; font-size: 9px; color: #333; line-height: 1.2;">
                                    Francisco Cabrera N° 419 - 2do Piso<br>
                                    Chiclayo<br>
                                    Tel: (074) 618 329 / Cel: 973 995 974
                                </p>
                            </td>
                        </tr>
                    </table>
                </header>

                <div class="ticket-sep"></div>

                <div class="ticket-meta">
                    <div class="ticket-meta__row">
                        <span>Comprobante</span>
                        <span class="ticket-meta__val">N° ' . $idCita . '</span>
                    </div>
                    <div class="ticket-meta__row">
                        <span>Emisión</span>
                        <span class="ticket-meta__val">' . $fechaHora . '</span>
                    </div>
                </div>

                <div class="ticket-sep"></div>

                <div class="ticket-block">
                    <h2 class="ticket-block__title">Paciente</h2>
                    <p class="ticket-data">' . $this->e($paciente) . '</p>
                    <p class="ticket-data ticket-data--muted">DNI: ' . $this->e($cita['dni'] ?? '—') . '</p>
                </div>

                <div class="ticket-sep"></div>

                <div class="ticket-block">
                    <h2 class="ticket-block__title">Detalle</h2>
                    <p class="ticket-data ticket-data--motivo">Pago por ' . $this->e($cita['motivo'] ?? '—') . '</p>' .
                    ($isFuture ? '
                    <table class="ticket-detalle">
                        <tr>
                            <td>Fecha cita</td>
                            <td class="ticket-detalle__val">' . $this->e($cita['fecha'] ?? '—') . '</td>
                        </tr>
                        <tr>
                            <td>Hora</td>
                            <td class="ticket-detalle__val">' . $this->e(substr((string)($cita['horario'] ?? ''), 0, 5)) . '</td>
                        </tr>
                    </table>' : '') . '
                </div>

                <div class="ticket-sep"></div>

                <div class="ticket-totales">
                    <div class="ticket-tot-row">
                        <span>Precio</span>
                        <span class="ticket-tot-row__val">S/ ' . number_format($precio, 2) . '</span>
                    </div>
                    <div class="ticket-tot-row ticket-tot-row--big">
                        <span>Pagado</span>
                        <span class="ticket-tot-row__val">S/ ' . number_format($monto, 2) . '</span>
                    </div>'
                    . ($saldo > 0
                        ? '<div class="ticket-tot-row ticket-tot-row--saldo">
                              <span>Saldo pendiente</span>
                              <span class="ticket-tot-row__val">S/ ' . number_format($saldo, 2) . '</span>
                          </div>'
                        : ''
                    ) . '
                </div>

                <div class="ticket-estado ticket-estado--' . strtolower(str_replace(' ', '-', $estadoPago)) . '">
                    ' . $estadoPago . '
                </div>

                <div class="ticket-meta__row" style="margin-top:6px;">
                    <span>Forma de pago</span>
                    <span class="ticket-meta__val">' . $this->e($tipoPago) . '</span>
                </div>

                <div class="ticket-sep"></div>

                <footer class="ticket-foot">
                    <p>Este documento es informativo y no un comprobante de pago.</p>
                    <p class="ticket-foot__thanks">¡Gracias por su preferencia!</p>
                </footer>

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
        if (!is_file($path)) {
            error_log("CSS no encontrado: $path");
            return '';
        }
        $css = (string) file_get_contents($path);
        // mPDF intentaría resolver @import externos (Google Fonts, etc.) y fallaría
        return (string) preg_replace('/@import\s[^;]+;/i', '', $css);
    }

    private function assetPath(string $relative): string
    {
        // Construir ruta completa
        $path = PUBLIC_PATH . DIRECTORY_SEPARATOR . 'assets' . DIRECTORY_SEPARATOR . ltrim($relative, '/\\');
        
        // Verificar que el archivo existe
        if (!is_file($path)) {
            error_log("PDF: Archivo de imagen no encontrado: $path");
            return '';
        }
        
        // Embeber imagen como base64
        return $this->imageToBase64($path);
    }

    private function imageToBase64(string $filePath): string
    {
        if (!is_file($filePath)) {
            return '';
        }
        
        $imageData = file_get_contents($filePath);
        
        // Detectar tipo MIME
        $mimeType = 'image/png'; // default
        if (strtolower(pathinfo($filePath, PATHINFO_EXTENSION)) === 'svg') {
            $mimeType = 'image/svg+xml';
        } else {
            if (function_exists('finfo_file')) {
                $finfo = finfo_open(FILEINFO_MIME_TYPE);
                if ($finfo) {
                    $mimeType = finfo_file($finfo, $filePath) ?: $mimeType;
                    finfo_close($finfo);
                }
            } elseif (function_exists('mime_content_type')) {
                $mimeType = mime_content_type($filePath) ?: $mimeType;
            }
        }
        
        return 'data:' . $mimeType . ';base64,' . base64_encode($imageData);
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
