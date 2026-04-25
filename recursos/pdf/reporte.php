<?php
require_once '../../vendor/autoload.php';
require_once 'pdfreporte.php';
//\
$fecha1 = $_GET['fecha1'];
$fecha2 = $_GET['fecha2'];
$tipomovimiento = $_GET['tipomovimiento'];
$css = file_get_contents('../css/estilos.css');

//$idatencion = $_REQUEST['idatencion'];
$mpdf = new \Mpdf\Mpdf([
    'format' => 'A4',
]);

$plantilla = getPlantillaReporte($fecha1, $fecha2, $tipomovimiento);
$mpdf->WriteHTML($css, \Mpdf\HTMLParserMode::HEADER_CSS);
$mpdf->WriteHTML($plantilla, \Mpdf\HTMLParserMode::HTML_BODY);

$mpdf->Output('Reporte.pdf', 'I');
