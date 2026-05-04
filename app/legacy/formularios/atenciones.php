<?php session_start(); ?>
<div class="cabecera">
  <h2>Atenciones</h2>
  <div class="cont-control">
    <input type="date" name="fechaAtenciones" id="fechaAtenciones" value="<?php echo date(
                                                                            'Y-m-d'
                                                                          ); ?>" onchange="ListarAtenciones()" />
  </div>
</div>
<div class="cont-tabla">
  <table>
    <thead>
      <tr>
        <th>Fecha</th>
        <th>Paciente</th>
        <th>Motivo de Consulta</th>
        <?php if ($_SESSION['cargo'] == 1) { ?>
          <th>Ver</th>
        <?php } ?>
      </tr>
    </thead>
    <tbody id="tbAtenciones">
      <!--AJAX-->
  </table>
</div>
<script>
  ListarAtenciones()
</script>