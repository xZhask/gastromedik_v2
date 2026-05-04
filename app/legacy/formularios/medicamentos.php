<div class="cabecera">
    <h2>Medicamentos</h2>
    <div class="cont-groupbotones">
        <button class="btn-secundario" type="button" onclick="abrirRegistroMovimientoAlmacen()">
            Reg. Movimiento
        </button>
        <button class="btn-secundario" type="button" onclick="abrirKardex()">
            Kardex
        </button>
    </div>
</div>
<div class="cont-medicamentos w100">
    <div class="cont-tabla cont-tb-med">
        <input type="text" class="w100" name="filtroProducto" id="filtroProducto" placeholder="Buscar ..." onkeyup="ListarMedicamentos()">
        <table>
            <thead>
                <tr>
                    <th>Código</th>
                    <th>Nombre</th>
                    <th>Stock</th>
                    <th>Tipo</th>
                    <th>Editar</th>
                    <th>Eliminar</th>
                </tr>
            </thead>
            <tbody id="tbMedicamentos">
                <!-- AJAX -->
            </tbody>
            <tfoot></tfoot>
        </table>
    </div>
    <form id="frmMedicamentos">
        <h2>Registrar Medicam./Insumo</h2>
        <input type="hidden" name="accion" id="accionProducto" value="REGISTRAR_PRODUCTO">
        <input type="hidden" name="IdProducto_M" id="IdProducto_M">
        <input type="text" id="nombreMedicamento" name="nombreMedicamento" placeholder="Nombre">
        <input type="number" id="CantidadInicial" name="CantidadInicial" placeholder="Cantidad Inicial">
        <select name="TipoInsumo" id="TipoInsumo">
            <option value="MEDICAM">MEDICAMENTO</option>
            <option value="INSUMO">INSUMO</option>
        </select>
        <button type="button" id="btnRegistrarProducto" onclick="RegistrarMedicamento()">Registrar</button>
        <button type="button" class="btn-cancelar" id="btnCancelarProducto" onclick="CancelarRegProd()">Cancelar</button>
    </form>
</div>
<script>
    ListarMedicamentos()

    $(function() {
        $(document).on('click', '#tbMedicamentos .fa-times-circle', function(event) {
            event.preventDefault()
            var parent = $(this).closest('table')
            var tr = $(this).closest('tr')
            codigo = $(tr).find('td').eq(0).html()
            nombre = $(tr).find('td').eq(1).html()

            //alert(codigo)
            Swal.fire({
                title: 'Desea Eliminar ' + nombre + '?',
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
                            accion: 'ELIMINAR_MEDICAMENTO',
                            idmedicamento: codigo,
                        },
                    }).done(function(resultado) {
                        if (resultado === 'SE ELIMINÓ MEDICAMENTO') {
                            Swal.fire('Medicamento Eliminado!', 'El registro fue eliminado.', 'success')
                            ListarMedicamentos()
                        } else {
                            Swal.fire('No fue posible Eliminar Registro ', resultado, 'error')
                        }
                    })
                }
            })
        })
    })
    $(function() {
        $(document).on('click', '#tbMedicamentos .fa-edit', function(event) {
            event.preventDefault()
            var parent = $(this).closest('table')
            var tr = $(this).closest('tr')
            codigo = $(tr).find('td').eq(0).html()
            nombre = $(tr).find('td').eq(1).html()
            tipo = $(tr).find('td').eq(3).html()
            $('#accionProducto').val('ACTUALIZAR_PRODUCTO')
            $('#btnRegistrarProducto').html('Actualizar')
            $('#IdProducto_M').val(codigo)
            $('#nombreMedicamento').val(nombre)
            $('#CantidadInicial').css('display', 'none')
            $('#CantidadInicial').val('0')
            $('#TipoInsumo').val(tipo)
            $('#btnCancelarProducto').css('display', 'block')
        })
    })
</script>