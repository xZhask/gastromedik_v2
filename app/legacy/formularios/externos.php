<?php date_default_timezone_set('America/Lima'); ?>
<div class="cabecera">
  <div class="cont-groupbotones controls-externos">
    <label for="FechaExterno1">De : </label>
    <div class="cont-control">
      <input type="date" name="FechaExterno1" id="FechaExterno1" value="<?php echo date(
          'Y-m-d'
      ); ?>" onchange="ListarCitasExternas()" />
    </div>
    <label for="FechaExterno2">a : </label>
    <div class="cont-control">

      <input type="date" name="FechaExterno2" id="FechaExterno2" value="<?php echo date(
          'Y-m-d'
      ); ?>" onchange="ListarCitasExternas()" />
    </div>
    <div class="cont-control control-select">
      <select class="establecimiento" name="establecimiento" id="establecimiento" onchange="ListarCitasExternas()"></select>
    </div>
  </div>

  <div class="cont-groupbotones">
    <button class="btn-secundario" type="button" onclick="abrirRegistroCitaExterna()">
      Nueva Cita
    </button>
    <button class="btn-secundario" type="button" onclick="abrirRegistroEstablecimiento()">
      N. Establecimiento
    </button>
  </div>
</div>
<div class="cont-totales">
  <label id="lbltotalexterno" for="">MONTO TOTAL:</label>
  <i class="fas fa-file-pdf btn-exportar" onclick="generarPDFExterno()"></i>
</div>
<div class="cont-tabla">
  <table>
    <thead>
      <tr>
          
        <th>Horario</th>
        <th>Fecha</th>
        <th>Paciente</th>
        <th>Establecimiento</th>
        <th>Procedimiento</th>
        <th>Precio</th>
        <!--<th>Estado</th>-->
        <th>Cancelar</th>
      </tr>
    </thead>
    <tbody id="tbCitasExternas">
      <!-- Ajax-->
    </tbody>
    <tfoot></tfoot>
  </table>
</div>
<script>
  CargarEstablecimientos()
  ListarCitasExternas()
  $(function() {
    $(document).on('click', '#tbCitasExternas .fa-times-circle', function(event) {
      event.preventDefault()
      var parent = $(this).closest('table')
      var tr = $(this).closest('tr')
      codigo = $(tr).find('td').eq(0).html()

      //alert(codigo)
      Swal.fire({
        title: 'Desea Anular la cita?',
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
              accion: 'ANULAR_CITA_EXTERNA',
              CodigoCitaExterna: codigo,
            },
          }).done(function(resultado) {
            if (resultado === 'SE ANULÓ CITA') {
              Swal.fire('Cita Anulada!', 'El registro fue eliminado.', 'success')
              ListarCitasExternas()
            } else {
              Swal.fire('No fue posible Anular Cita', resultado, 'error')
            }
          })
        }
      })
    })
  })
</script>