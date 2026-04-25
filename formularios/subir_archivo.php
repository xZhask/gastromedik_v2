<?php
session_name('gastromedik_session');
session_start();
$csrf       = $_SESSION['_csrf_token'] ?? '';
$idatencion = htmlspecialchars($_REQUEST['id'] ?? '');
$nombre     = htmlspecialchars($_REQUEST['nombre'] ?? '');
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Cargar Archivo</title>
    <link rel="stylesheet" type="text/css" href="/assets/css/estilos.css" />
    <script src="https://kit.fontawesome.com/47b4aaa3bf.js" crossorigin="anonymous"></script>
</head>
<body>
    <div class="cont_subirArchivo">
        <h2><?= $nombre ?></h2>
        <form id="frmUploadFile" method="POST" action="/atenciones/subir-archivo" enctype="multipart/form-data">
            <input type="hidden" name="_csrf_token" value="<?= $csrf ?>">
            <input type="hidden" name="idatencion" id="idatencion" value="<?= $idatencion ?>">
            <span class="mi-archivo">
                <input type="file" name="mi-archivo" id="mi-archivo" accept="application/pdf" required>
            </span>
            <label for="mi-archivo">
                <span>Arrastra o Click para seleccionar Archivo</span>
                <i class="far fa-folder-open"></i>
            </label>
            <button class="submit" type="submit">SUBIR ARCHIVO</button>
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
