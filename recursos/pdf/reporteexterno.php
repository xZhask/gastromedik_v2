<?php
require_once '../../vendor/autoload.php';
require_once 'pdfreporteexterno.php';
//\
$fecha1 = $_GET['fecha1'];
$fecha2 = $_GET['fecha2'];
$establecimiento = $_GET['establecimiento'];
$css = file_get_contents('../css/estilos.css');

//$idatencion = $_REQUEST['idatencion'];
$mpdf = new \Mpdf\Mpdf([
    'format' => 'A4',
]);

$plantilla = getPlantillaexterna($fecha1, $fecha2, $establecimiento);
$mpdf->WriteHTML($css, \Mpdf\HTMLParserMode::HEADER_CSS);
$mpdf->WriteHTML($plantilla, \Mpdf\HTMLParserMode::HTML_BODY);

$mpdf->Output('ReporteExt.pdf', 'I');
