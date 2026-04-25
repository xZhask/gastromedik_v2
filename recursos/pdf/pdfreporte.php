<?php
require_once '../../sistema/ado/clsConsultas.php';
require_once '../../sistema/ado/clsCita.php';

function getPlantillaReporte($fecha1, $fecha2, $tipomovimiento)
{
    $objConsultas = new clsConsultas();
    $objCita = new clsCita();

    $f1 = date_create($fecha1);
    $f2 = date_create($fecha2);
    $titulo = 'REPORTE DE ' . $tipomovimiento . 'S DEL ' . date_format($f1, 'd/m/Y') . ' AL ' . date_format($f2, 'd/m/Y');
    

    $fecha1 .= ' 00:00:00';
    $fecha2 .= ' 23:59:59';
    $filtro = [
        'tipomovimientocaja' => $tipomovimiento,
        'fecha1' => $fecha1,
        'fecha2' => $fecha2,
    ];
    $listadoreporte = $objConsultas->ReporteCantidades($filtro);

    if ($listadoreporte->rowCount() > 0) {
        $efectivo = 0.00;
        $transf = 0.00;
        $pos = 0.00;
        $yape = 0.00;
        $tabla='';
        $cont=1;
        while ($fila = $listadoreporte->fetch(PDO::FETCH_NAMED)) {
            $tipopago = $fila['tipopago'];
            $tipomovimiento = $fila['tipomovimientocaja'];
            $codigoreferencia = $fila['codigoreferencia'];
            $paciente = $objCita->ObtenerDatosCita($codigoreferencia);
            $paciente = $paciente->fetch(PDO::FETCH_NAMED);
            $paciente = $paciente['apellidospaciente'] . ', ' . $paciente['nombrepaciente'];
            $estado = '';
            if ($tipomovimiento === 'A-INGRESO' || $tipomovimiento === 'A-GASTO') $estado = 'ANULADO';
            
            $tabla  .=    '<tr>';
            $tabla  .=    '<td class="ta-center">' . $cont . '</td>';
            $tabla  .=    '<td class="ta-center">' . $fila['fecha'] . '</td>';
            $tabla  .=    '<td class="ta-center">' . $paciente . '</td>';
            $tabla  .=    '<td class="ta-center">' . $fila['descripcion'] . '</td>';
            $tabla  .=    '<td class="ta-center">' . $fila['monto'] . '</td>';
            $tabla  .=    '<td class="ta-center">' . $tipopago . '</td>';
            $tabla  .=    '<td class="ta-center">' . $fila['nick'] . '</td>';
            $tabla  .=    '<td class="ta-center lnk-red">' . $estado . '</td>';
            $tabla  .=    '</tr>';

            if ($tipopago === 'EFECTIVO') {
                $efectivo += $fila['monto'];
            }
            if ($tipopago === 'TRANSFERENCIA') {
                $transf += $fila['monto'];
            }
            if ($tipopago === 'POS') {
                $pos += $fila['monto'];
            }
            if ($tipopago === 'YAPE') {
                $yape += $fila['monto'];
            }
            $cont++;
        }
    }
    $plantilla = '<body>';
    $plantilla .= '<h3 class="titulo-report">'.$titulo.'</h3>';
    $plantilla.='<div class="resumen-report">';
    $plantilla.='<table><tr>';
    $plantilla.='<td><img class="report-logo" src="../img/logoticket2.png"></td>';
    $plantilla.='<td>
                <table class="tbresumen">
                    <thead>
                        <tr><th colspan="2">Resumen</th></tr>
                    </thead>
                    <tbody>
                        <tr><td>Efectivo</td><td class="monto">'. number_format($efectivo,2).'</td></tr>
                        <tr><td>Transferencia</td><td class="monto">'.number_format($transf,2).'</td></tr>
                        <tr><td>Yape</td><td class="monto">'.number_format($yape,2).'</td></tr>
                        <tr><td>POS</td><td class="monto">'.number_format($pos,2).'</td></tr>
                        <tr><td>Plin</td><td class="monto">0.00</td></tr>
                    </tbody>
                </table>
                </td>';
    $plantilla.='</table></tr>';
    $plantilla.='</div>';

    $plantilla .='<table class="tbreport-pdf">';
    $plantilla .=   '<thead><tr>
                        <th>#</th>
                        <th>Fecha</th>
                        <th>Paciente</th>
                        <th>Motivo</th>
                        <th>Monto</th>
                        <th>Tipo</th>
                        <th>Usuario</th>
                        <th>Estado</th>
                    </tr></thead>';
    $plantilla .=   '<tbody>'.  $tabla;
    $plantilla .=   '</tbody>';
    $plantilla .='</table>';
    $plantilla .= '</body>';
    return $plantilla;
}
