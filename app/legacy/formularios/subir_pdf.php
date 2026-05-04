<?php
session_name('gastromedik_session');
session_start();
$csrf       = $_SESSION['_csrf_token'] ?? '';
$idpaciente = htmlspecialchars($_REQUEST['id'] ?? '');
$nombre     = htmlspecialchars($_REQUEST['nombre'] ?? '');
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Cargar Archivo PDF</title>
    <link rel="stylesheet" type="text/css" href="/assets/css/estilos.css" />
    <script src="https://kit.fontawesome.com/47b4aaa3bf.js" crossorigin="anonymous"></script>
</head>
<body>
    <div class="cont_subirRX">
        <h2><?= $nombre ?></h2>
        <form method="POST" action="/examenes/subir-pdf" enctype="multipart/form-data">
            <input type="hidden" name="_csrf_token" value="<?= $csrf ?>">
            <input type="hidden" name="idpaciente" id="idpaciente" value="<?= $idpaciente ?>">
            <span class="mi-archivo">
                <input type="file" name="mi-archivo" id="mi-archivo" accept="application/pdf" required>
            </span>
            <label for="mi-archivo">
                <span>Arrastra o Click para seleccionar Archivo</span>
                <i class="far fa-folder-open"></i>
            </label>
            <div class="contenedor-upload">
                <input type="text" name="nombreexamen" id="nombreexamen" placeholder="Nombre o Descripción de archivo" required>
                <button type="submit" class="btn-upload"><i class="fas fa-cloud-upload-alt"></i> Subir</button>
            </div>
        </form>
    </div>
    <script src="https://code.jquery.com/jquery-3.4.1.min.js"></script>
    <script>
        jQuery('#mi-archivo').change(function() {
            var filename = jQuery(this).val().split('\\').pop()
            var idname = jQuery(this).attr('id')
            jQuery('span.' + idname).next().find('span').html(filename)
        })
    </script>
</body>
</html>
