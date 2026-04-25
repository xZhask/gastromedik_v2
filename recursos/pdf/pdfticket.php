<?php
require_once '../../sistema/ado/clsCita.php';
require_once '../../sistema/ado/clsCaja.php';
function getPlantillaticket($idcita)
{
    $objCita = new clsCita();
    $objCaja = new clsCaja();
    $datoscita = $objCita->ObtenerDatosCita($idcita);
    $datoscita = $datoscita->fetch(PDO::FETCH_NAMED);

    $buscarMovimiento = $objCaja->BuscarMovimientoXcita($idcita);
    $buscarMovimiento = $buscarMovimiento->fetch(PDO::FETCH_NAMED);
    $monto = $buscarMovimiento['monto'];

    $plantilla =
        '<body class="bodyticket">
            <div class="cont-ticket">
                <div class="cont-imgticket">
                    <img src="../img/logoticket2.png">
                </div>
                <div>
                    <div class="infoticket">
                        <p>Francisco Cabrera N° 419 2° Piso<br>
                        (Esq. con A, Lapoint) - Chiclayo<br>
                        Tel: (074) 618 329<br>
                        Cel: 973 995 974<br>' . date('d-m-Y H:i:s') . '</p>
                        <p class="nrocita">N° CITA : ' . $idcita . '</p>
                    </div>
                    <div class="cuerpoticket">
                        <div class="linea"></div>
                        <p class="apartado">DATOS DE PACIENTE :</p>
                        <div class="linea"></div>
                        <p><span>PACIENTE : </span> ' . $datoscita['apellidospaciente'] . ', ' . $datoscita['nombrepaciente']  . '</p>
                        <p><span>N° DOC : </span> ' . $datoscita['dni'] . '</p>                
                        <div class="linea"></div>
                        <p class="apartado">DATOS DE CITA :</p>
                        <div class="linea"></div>
                        <p><span>FECHA CITA : </span> ' . $datoscita['fecha'] . '</p> 
                        <p><span>HORA CITA : </span> ' . $datoscita['horario'] . '</p> 
                        <p><span>MOTIVO : </span> ' . $datoscita['motivo'] . '</p> 
                        <p><span>PRECIO : </span> ' . $datoscita['precio_consulta'] . '</p>
                        <p><span>A CUENTA : </span> ' . $monto . '</p>
                    </div>
                    <div class="linea"></div>
                    <div class="infoticket"><p>Este no es un comprobante de Pago.<br>Gracias por su gentil preferencia</p><div>
                </div>
            </div>
        </body>';
    return $plantilla;
}
