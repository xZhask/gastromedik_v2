<?php
require_once '../../vendor/autoload.php';
require_once 'pdfhis.php';
//\
$idatencion = $_GET['idatencion'];
$css = file_get_contents('../css/estilos.css');

//$idatencion = $_REQUEST['idatencion'];
$mpdf = new \Mpdf\Mpdf([
    ['mode' => 'utf-8', 'format' => [140, 190]]
]);

$plantilla = getPlantilla($idatencion);
$mpdf->WriteHTML($css, \Mpdf\HTMLParserMode::HEADER_CSS);
$mpdf->WriteHTML($plantilla, \Mpdf\HTMLParserMode::HTML_BODY);

$mpdf->Output('Receta.pdf', 'I');
