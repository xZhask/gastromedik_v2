<?php
require_once '../../sistema/ado/clsCita.php';
require_once __DIR__ . '/../../vendor/autoload.php';
use Mike42\Escpos\Printer;
use Mike42\Escpos\EscposImage;
use Mike42\Escpos\PrintConnectors\WindowsPrintConnector;

/*
	Este ejemplo imprime un
	ticket de venta desde una impresora térmica
*/

$objCita = new clsCita();

$idcita = $_POST['idcita'];
$datoscita = $objCita->ObtenerDatosCita($idcita);
$datoscita = $datoscita->fetch(PDO::FETCH_NAMED);

/*
    Aquí, en lugar de "POS" (que es el nombre de mi impresora)
	escribe el nombre de la tuya. Recuerda que debes compartirla
	desde el panel de control
*/

$nombre_impresora = 'IMPTICKET';
$connector = new WindowsPrintConnector($nombre_impresora);
$printer = new Printer($connector);
#Mando un numero de respuesta para saber que se conecto correctamente.
echo '1';
/*
	Vamos a imprimir un logotipo
	opcional. Recuerda que esto
	no funcionará en todas las
	impresoras

	Pequeña nota: Es recomendable que la imagen no sea
	transparente (aunque sea png hay que quitar el canal alfa)
	y que tenga una resolución baja. En mi caso
	la imagen que uso es de 250 x 250
*/

# Vamos a alinear al centro lo próximo que imprimamos
$printer->setJustification(Printer::JUSTIFY_CENTER);

/*
	Intentaremos cargar e imprimir
	el logo
*/
try {
	$logo = EscposImage::load('logoticket.png', false);
	$printer->bitImage($logo);
} catch (Exception $e) {
	/*No hacemos nada si hay error*/
}
/*
	Ahora vamos a imprimir un encabezado
*/
$printer->text('Francisco Cabrera N° 419 2° Piso' . "\n");
$printer->text('(Esq. con A, Lapoint) - Chiclayo' . "\n");
$printer->text('Tel: (074) 618 329' . "\n");
$printer->text('Cel: 973 995 974' . "\n");
date_default_timezone_set('America/Lima');
$printer->text(date('d-m-Y H:i:s') . "\n");
$printer->selectPrintMode(Printer::MODE_DOUBLE_WIDTH);
$printer->text('N° CITA : ' . $idcita . "\n");
$printer->setJustification(Printer::JUSTIFY_LEFT);
$printer->selectPrintMode(Printer::MODE_FONT_A);
$printer->text('---- DATOS DE PACIENTE ------' . "\n");
$printer->text('PAC. : ' . $datoscita['apellidospaciente'] . ', ' . $datoscita['nombrepaciente'] . "\n");
$printer->text('N° DOC. : ' . $datoscita['dni'] . "\n");
$printer->text('---- DATOS DE CITA ------' . "\n");
$printer->text('FECHA CITA : ' . $datoscita['fecha'] . "\n");
$printer->text('HORA CITA. : ' . $datoscita['horario'] . "\n");
$printer->text('MOTIVO : ' . $datoscita['motivo'] . "\n");
$printer->text('PRECIO : ' . $datoscita['precio'] . "\n");
$printer->selectPrintMode(Printer::MODE_FONT_A);
$printer->text('--------------------------------------------' . "\n");
$printer->setJustification(Printer::JUSTIFY_CENTER);
$printer->text("Este no es un comprobante de Pago.\n");
$printer->text("Gracias por su gentil preferencia\n");

/*Alimentamos el papel 3 veces*/
$printer->feed(3);

/*
	Cortamos el papel. Si nuestra impresora
	no tiene soporte para ello, no generará
	ningún error
*/
$printer->cut();

/*
	Por medio de la impresora mandamos un pulso.
	Esto es útil cuando la tenemos conectada
	por ejemplo a un cajón
*/
$printer->pulse();

/*
	Para imprimir realmente, tenemos que "cerrar"
	la conexión con la impresora. Recuerda incluir esto al final de todos los archivos
*/
$printer->close();
