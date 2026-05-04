<?php
session_start();
$cargo = $_SESSION['cargo'];
?>
<div class="cabecera">
  <h2>ATENCIONES DE HOY</h2>
</div>
<div class="cont-tabla">
  <table>
    <thead>
      <tr>
        <th>Horario</th>
        <!--<th>Dni</th>-->
        <th>Paciente</th>
        <th>Motivo de Consulta</th>
        <th>Reg. Signos Vitales</th>
        <?php
        if ($cargo == 1 || $cargo == 2) { ?>
          <th>Registrar Atención</th>
        <?php }
        ?>
      </tr>
    </thead>
    <tbody id="tbConfirmados">
    </tbody>
    <tfoot></tfoot>
  </table>
</div>
<script>
  ListarConfirmados()
  $(function() {
    $(document).on('click', '#tbConfirmados .fa-file-medical', function(e) {
      e.preventDefault()
      let parent = $(this).closest('table')
      let tr = $(this).closest('tr')
      let codigo = $(tr).find('td').eq(1).html()
      let nombre = $(tr).find('td').eq(3).html()
      let ancho = 1000
      let alto = 800
      let x = parseInt(window.screen.width / 2 - ancho / 2)
      let y = parseInt(window.screen.height / 2 - alto / 2)

      $url = `subir_archivo.php?id=${codigo}&nombre=${nombre}`;
      window.open($url, 'His', `left=${x},top=${y},height=${alto},width=${ancho},scrollbar=si,location=no,resizable=si,menubar=no`)
    })
  })
</script>