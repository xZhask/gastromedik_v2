<?php
require_once '../../sistema/ado/clsCita.php';

function getPlantillaexterna($fecha1, $fecha2, $establecimiento)
{
    $objCita = new clsCita();

    $total = 0.0;

    if ($establecimiento == '' || $establecimiento == '0') {
        $listadoCitasExternas = $objCita->ListarCitasExternas($fecha1, $fecha2);
    } else {
        $datos = [
            'fecha1' => $fecha1,
            'fecha2' => $fecha2,
            'establecimiento' => $establecimiento,
        ];
        $listadoCitasExternas = $objCita->FiltrarCitasExternas($datos);
    }
    $plantilla =
        '<body>
            <h4>Reporte del ' . $fecha1 . ' al ' . $fecha2 . '</h4>
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
            <tbody>';
    if ($listadoCitasExternas->rowCount() > 0) {
        while ($fila = $listadoCitasExternas->fetch(PDO::FETCH_NAMED)) {
            $plantilla .= '<tr>';
            $plantilla .= '<td class="ta-center">' . $fila['hora'] . '</td>';
            $plantilla .= '<td class="ta-center">' . $fila['fecha'] . '</td>';
            $plantilla .= '<td class="ta-center">' .
                $fila['establecimiento'] .
                '</td>';
            $plantilla .= '<td class="ta-center">' . $fila['motivo'] . '</td>';
            $plantilla .= '<td class="ta-center">' . $fila['precio'] . '</td>';
            $plantilla .= '</tr>';
            $total = $total + $fila['precio'];
        }
        $plantilla .= '<tr><td class="rep_total" colspan="5"> TOTAL : ' . $total . '</td></tr>';
    } else {
        $plantilla .= '<tr><td colspan="5">NO HAY PERSONAS CITADAS</td></tr>';
    }
    $plantilla .= '</tbody></table></div></body>';
    return $plantilla;
}
