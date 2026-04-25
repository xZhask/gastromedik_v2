<?php date_default_timezone_set('America/Lima'); ?>
<div class="cabecera">
    <div class="cont-groupbotones controls-externos">
        <label for="FechaAtencion1">De : </label>
        <div class="cont-control">
            <input type="date" name="FechaAtencion1" id="FechaAtencion1" value="<?php echo date(
                                                                                    'Y-m-d'
                                                                                ); ?>" onchange="ListarCantidadAtencion()" />
        </div>
        <label for="FechaAtencion2">a : </label>
        <div class="cont-control">

            <input type="date" name="FechaAtencion2" id="FechaAtencion2" value="<?php echo date(
                                                                                    'Y-m-d'
                                                                                ); ?>" onchange="ListarCantidadAtencion()" />
        </div>
        <div class="cont-control control-select">
            <select class="tipoAtencion" name="tipoAtencion" id="tipoAtencion" onchange="ListarCantidadAtencion()"></select>
        </div>
    </div>
</div>
<div class="cont-tabla">
    <table>
        <thead>
            <tr>
                <th>Procedimientos</th>
                <th>Cantidad</th>
            </tr>
        </thead>
        <tbody id="tbCantidadAtenciones">
            <!-- Ajax-->
        </tbody>
        <tfoot></tfoot>
    </table>
</div>
<script>
    CargarTipoAtenciones()
    ListarCantidadAtencion()
    $(function() {
        $(document).on('click', '#tbCantidadAtenciones .fa-times-circle', function(event) {
            event.preventDefault()
            var parent = $(this).closest('table')
            var tr = $(this).closest('tr')
            codigo = $(tr).find('td').eq(0).html()
        })
    })
</script>