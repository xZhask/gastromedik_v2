<?php
require_once '../../sistema/ado/clsAtencion.php';

function getPlantilla($idatencion)
{
    $objAtencion = new clsAtencion();
    $listadoAtencion = $objAtencion->ObtenerTratamiento($idatencion);
    $plantilla =
        '<body>
            <p id="titulo_receta">r</p>
        <div class="cont-tabla cont-receta">
        <table>
            <thead>
                <tr>
                    <th>Medicamento</th>
                    <th>Indicación</th>
                </tr>
            </thead>
            <tbody>';
    while ($fila = $listadoAtencion->fetch(PDO::FETCH_NAMED)) {
        $plantilla .=
            '<tr><td>' . $fila['nombre'] . '</td>
            <td>' . $fila['indicaciones'] . '</td></tr>';
    }
    $plantilla .= '</tbody></table></div></body>';
    return $plantilla;
}
