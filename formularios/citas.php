<?php date_default_timezone_set('America/Lima');
session_start();
$cargo = $_SESSION['cargo'];
?>
<div class="cabecera">
  <div class="cont-control">
    <input type="date" name="FechaCitados" id="FechaCitados" value="<?php echo date(
                                                                      'Y-m-d'
                                                                    ); ?>" onchange="ListarCitas()" />
  </div>
  <div class="cont-groupbotones">
    <button class="btn-secundario" type="button" onclick="abrirBuscarCita()">
      Buscar Cita
    </button>
    <button class="btn-secundario" type="button" onclick="abrirRegistrarCita()">
      Nueva Cita
    </button>
  </div>
</div>
<div class="cont-tabla">
  <table>
    <thead>
      <tr>
        <th>Hora</th>
        <th>Paciente</th>
        <th>Motivo de Consulta</th>
        <th>N° Celular</th>
        <th>Asistencia</th>
        <th>Editar</th>
        <?php if ($cargo == '1') { ?>
          <th>Anular</th>
        <?php } ?>
        <th>Imp.</th>
      </tr>
    </thead>
    <tbody id="tbCitas">
      <!-- AJAX -->
    </tbody>
    <tfoot></tfoot>
  </table>
</div>
<script>
  fecha = new Date()
  ListarCitas()
  $(function() {
    $(document).on('click', '#tbCitas .lnk-RegPago', function(event) {
      event.preventDefault()
      var parent = $(this).closest('table')
      var tr = $(this).closest('tr')
      codigo = $(tr).find('td').eq(0).html()

      $('#IdCita').val(codigo)
      abrirRegistrarPago()
      MostrarPagar()
    })
  })
  $(function() {
    $(document).on('click', '#tbCitas .lnk-Ambar', function(event) {
      event.preventDefault()
      var parent = $(this).closest('table')
      var tr = $(this).closest('tr')
      codigo = $(tr).find('td').eq(0).html()

      $('#IdCita').val(codigo)
      abrirRegistrarPago()
      MostrarPagar()
      //MostrarPagarCuenta()
    })
  })
  $(function() {
    $(document).on('click', '#tbCitas .fa-times-circle', function(event) {
      event.preventDefault()
      var parent = $(this).closest('table')
      var tr = $(this).closest('tr')
      codigo = $(tr).find('td').eq(0).html()
      nombre = $(tr).find('td').eq(2).html()

      //alert(codigo)
      Swal.fire({
        title: 'Desea Anular la cita de ' + nombre + '?',
        text: 'Esto no se podrá revertir!',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#9dc15b',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, Anular',
      }).then((result) => {
        if (result.isConfirmed) {
          $.ajax({
            method: 'POST',
            url: 'sistema/controlador/controlador.php',
            data: {
              accion: 'ANULAR_CITA',
              idcita: codigo,
            },
          }).done(function(resultado) {
            if (resultado === 'SE ANULÓ CITA') {
              Swal.fire('Cita Anulada!', 'El registro fue eliminado.', 'success')
              ListarCitas()
            } else {
              Swal.fire('No fue posible Anular Cita', resultado, 'error')
            }
          })
        }
      })
    })

  })
</script>