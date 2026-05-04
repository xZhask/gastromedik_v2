<?php date_default_timezone_set('America/Lima'); ?>
<div class="cabecera">

</div>
<div class="cont-tabla">
    <table>
        <thead>
            <tr>
                <th>Fecha de Cita</th>
                <th>Hora</th>
                <th>Paciente</th>
                <th>Motivo de Consulta</th>
                <th>N° Celular</th>
                <th>Pagar</th>
            </tr>
        </thead>
        <tbody id="tbPendientes">
            <!-- AJAX -->
        </tbody>
        <tfoot></tfoot>
    </table>
</div>
<script>
    fecha = new Date()
    ListarPendientes()
    $(function() {
        $(document).on('click', '#tbPendientes .lnk-Ambar', function(event) {
            event.preventDefault()
            var parent = $(this).closest('table')
            var tr = $(this).closest('tr')
            codigo = $(tr).find('td').eq(0).html()

            $('#IdCita').val(codigo)
            abrirRegistrarPago()
            MostrarPagar()
            MostrarPagarCuenta()
        })
    })
    $(function() {
        $(document).on('click', '#tbPendientes .lnk-RegPago', function(event) {
            event.preventDefault()
            var parent = $(this).closest('table')
            var tr = $(this).closest('tr')
            codigo = $(tr).find('td').eq(0).html()

            $('#IdCita').val(codigo)
            abrirRegistrarPago()
            MostrarPagar()
        })
    })
</script>