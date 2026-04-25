<?php
require_once '../../vendor/autoload.php';
require_once 'pdfticket.php';
//\
$idcita = $_GET['idcita'];

$css = file_get_contents('../css/estilos.css');

//$idatencion = $_REQUEST['idatencion'];
$mpdf = new \Mpdf\Mpdf([
    [
        'mode' => 'utf-8',
        'format' => [80, 150],
        'margin_left' => 3,
        'margin_right' => 3,
        'margin_top' => 12,
        'margin_bottom' => 10,
        'margin_header' => 10,
    ]
]);

$plantilla = getPlantillaticket($idcita);
$mpdf->WriteHTML($css, \Mpdf\HTMLParserMode::HEADER_CSS);
$mpdf->WriteHTML($plantilla, \Mpdf\HTMLParserMode::HTML_BODY);

$mpdf->Output('Ticket.pdf', 'I');