<?php
session_start();
$cargo = $_SESSION['cargo'];
?>
<div class="cabecera">
  <h2>Pacientes</h2>
  <div class="cont-busqueda">
    <input type="text" name="FiltroPaciente" id="FiltroPaciente" placeholder="Buscar Paciente" />
    <button type="" class="btn-buscar" onclick="FiltrarPaciente()">
      <i class="fas fa-search"></i>
    </button>
  </div>
  <?php if ($cargo == 1 || $cargo == 4) { ?>
  <div class="cont-groupbotones">
    <button class="btn-secundario" type="button" onclick="abrirRegistrarPaciente()">
      Nuevo
    </button>
  </div>
  <?php } ?>
</div>
<div class="cont-tabla">
  <table>
    <thead>
      <tr>
        <th>DNI</th>
        <!--<th>Apellidos</th>-->
        <th>Nombre</th>
        <th>Edad</th>
        <th>Teléfono</th>
        <?php if ($cargo == 1 || $cargo == 4) { ?>
          <th>Editar</th>
          <th>Eliminar</th>
        <?php } ?>
        <?php if ($cargo == 1 || $cargo == 2 || $cargo == 4) { ?>
          <th>Historial</th>
        <?php } ?>
        <th>Imagen</th>
        <th>PDF</th>
        <!--<th>N. Atención</th>-->
      </tr>
    </thead>
    <tbody id="tbPacientes">
      <!-- AJAX -->
    </tbody>
    <tfoot></tfoot>
  </table>
</div>
<script>
  ListarPacientes()
  $(function() {
    $(document).on('click', '#tbPacientes .fa-user-times', function(event) {
      event.preventDefault()
      var parent = $(this).closest('table')
      var tr = $(this).closest('tr')
      codigo = $(tr).find('td').eq(0).html()
      apellidos = $(tr).find('td').eq(1).html()
      nombre = $(tr).find('td').eq(2).html()

      //alert(codigo)
      Swal.fire({
        title: 'Desea Eliminar a ' + apellidos + ', ' + nombre + '?',
        text: 'No podrás revertir!',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#9dc15b',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, eliminar',
      }).then((result) => {
        if (result.isConfirmed) {
          $.ajax({
            method: 'POST',
            url: 'sistema/controlador/controlador.php',
            data: {
              accion: 'ELIMINAR_PACIENTE',
              idpaciente: codigo,
            },
          }).done(function(resultado) {
            if (resultado === 'SE ELIMINÓ PACIENTE') {
              Swal.fire('Eliminado!', 'El registro fue eliminado.', 'success')
              ListarPacientes()
            } else {
              Swal.fire('No fue posible eliminar registro', resultado, 'error')
            }
          })
        }
      })
    })
  })
  //SUBIR ARCHIVOS IMAGENES
  $(function() {
    $(document).on('click', '#tbPacientes .fa-images', function(
      event,
    ) {
      event.preventDefault()
      var parent = $(this).closest('table')
      var tr = $(this).closest('tr')
      codigo = $(tr).find('td').eq(0).html()
      apellidos = $(tr).find('td').eq(1).html()
      nombre = $(tr).find('td').eq(2).html()
      nombrecompleto = apellidos + ', ' + nombre
      var ancho = 1000
      var alto = 800
      var x = parseInt(window.screen.width / 2 - ancho / 2)
      var y = parseInt(window.screen.height / 2 - alto / 2)

      $url =
        'subir_imgs.php?id=' +
        codigo +
        '&nombre=' +
        nombrecompleto
      window.open(
        $url,
        'His',
        'left=' +
        x +
        ',top=' +
        y +
        ',height=' +
        alto +
        'width=' +
        ancho +
        ',scrollbar=si,location=no,resizable=si,menubar=no',
      )
      //ListarConfirmados()
    })
  })
  //SUBIR ARCHIVOS PDF
  $(function() {
    $(document).on('click', '#tbPacientes .fa-file-pdf', function(
      event,
    ) {
      event.preventDefault()
      var parent = $(this).closest('table')
      var tr = $(this).closest('tr')
      codigo = $(tr).find('td').eq(0).html()
      apellidos = $(tr).find('td').eq(1).html()
      nombre = $(tr).find('td').eq(2).html()
      nombrecompleto = apellidos + ', ' + nombre
      var ancho = 1000
      var alto = 800
      var x = parseInt(window.screen.width / 2 - ancho / 2)
      var y = parseInt(window.screen.height / 2 - alto / 2)

      $url =
        'subir_pdf.php?id=' +
        codigo +
        '&nombre=' +
        nombrecompleto
      window.open(
        $url,
        'His',
        'left=' +
        x +
        ',top=' +
        y +
        ',height=' +
        alto +
        'width=' +
        ancho +
        ',scrollbar=si,location=no,resizable=si,menubar=no',
      )
    })
  })
</script>