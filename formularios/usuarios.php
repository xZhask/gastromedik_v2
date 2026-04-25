<?php session_start();
$cargo = $_SESSION['cargo'];
?>
<div class="cabecera">
    <h2>Usuarios</h2>
    <div class="cont-busqueda">
        <input type="text" name="searchUsuario" id="searchUsuario" placeholder="Buscar Usuario" />
        <button type="" class="btn-buscar">
            <i class="fas fa-search"></i>
        </button>
    </div>
    <?php
    if ($cargo == '1') { ?>
        <div class="cont-groupbotones">
            <button class="btn-secundario" type="button" onclick="abrirRegistroUsuario()">
                Nuevo
            </button>
            <button class="btn-secundario" type="button" onclick="abrirRegistroCargo()">
                N. Cargo
            </button>
        </div><?php } ?>
</div>
<div class="cont-tabla">
    <table>
        <thead>
            <tr>
                <th>DNI</th>
                <th>Nombres</th>
                <th>Usuario</th>
                <th>Cargo</th>
                <?php
                if ($cargo == 1) { ?>
                    <th>Estado</th>
                    <th>Editar</th>
                    <th>Contraseña</th>
                <?php } ?>
            </tr>
        </thead>
        <tbody id="tbUsuarios">
            <tr>
                <td class="ta-center">12345678</td>
                <td class="ta-center">Walter Junior Rodriguez Cumpa</td>
                <td class="ta-center">Juniormix</td>
                <td class="ta-center">ADMINISTRADOR</td>
                <td class="ta-center">A</td>
                <td class="ta-center"><i class="far fa-edit edit-usuario"></i></td>
            </tr>
        </tbody>
        <tfoot></tfoot>
    </table>
</div>
<script>
    ListarPersonal()
    ListarCargos()
</script>