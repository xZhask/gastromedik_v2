<?php

use App\Controllers\AtencionController;
use App\Controllers\AuthController;
use App\Controllers\CajaController;
use App\Controllers\Cie10Controller;
use App\Controllers\CitaController;
use App\Controllers\DashboardController;
use App\Controllers\EstablecimientoController;
use App\Controllers\ExamenesController;
use App\Controllers\MedicamentoController;
use App\Controllers\PacienteController;
use App\Controllers\PageController;
use App\Controllers\PdfController;
use App\Controllers\PersonalController;
use App\Controllers\PosController;
use App\Controllers\ProcedimientoController;
use App\Controllers\ReporteController;
use App\Core\Router;
use App\Middleware\AuthMiddleware;
use App\Middleware\CsrfMiddleware;

$auth = [AuthMiddleware::class];
$csrf = [AuthMiddleware::class, CsrfMiddleware::class];

// Paginas HTML
$router->get('/login', [PageController::class, 'login']);
$router->get('/',      [PageController::class, 'dashboard'])->middleware($auth);

// Dashboard Analíticas
$router->get('/api/dashboard/kpis',           [DashboardController::class, 'kpis'])->middleware($auth);
$router->get('/api/dashboard/finanzas',       [DashboardController::class, 'finanzas'])->middleware($auth);
$router->get('/api/dashboard/procedimientos', [DashboardController::class, 'procedimientos'])->middleware($auth);

// Autenticacion
$router->post('/login',        [AuthController::class, 'login']);
$router->post('/logout',       [AuthController::class, 'logout'])->middleware($auth);
$router->get('/check-session', [AuthController::class, 'checkSession'])->middleware($auth);

// Personal
$router->get ('/api/personal',                    [PersonalController::class, 'index'])->middleware($auth);
$router->get ('/api/personal/cargos',             [PersonalController::class, 'cargos'])->middleware($auth);
$router->get ('/api/personal/{dni}',              [PersonalController::class, 'show'])->middleware($auth);
$router->get ('/api/personal/consulta-dni/{dni}', [PersonalController::class, 'consultaDni'])->middleware($auth);
$router->post('/api/personal',                    [PersonalController::class, 'store'])->middleware($csrf);
$router->put ('/api/personal/{dni}',              [PersonalController::class, 'update'])->middleware($csrf);
$router->post('/api/personal/cambiar-pass',       [PersonalController::class, 'cambiarPass'])->middleware($csrf);
$router->post('/api/personal/cargos',             [PersonalController::class, 'storeCargo'])->middleware($csrf);

// Pacientes
$router->get   ('/api/pacientes',       [PacienteController::class, 'index'])->middleware($auth);
$router->get   ('/api/pacientes/{dni}', [PacienteController::class, 'show'])->middleware($auth);
$router->post  ('/api/pacientes',       [PacienteController::class, 'store'])->middleware($csrf);
$router->put   ('/api/pacientes/{dni}', [PacienteController::class, 'update'])->middleware($csrf);
$router->delete('/api/pacientes/{dni}', [PacienteController::class, 'destroy'])->middleware($csrf);

// Citas
$router->get   ('/api/citas',                   [CitaController::class, 'index'])->middleware($auth);
$router->get   ('/api/citas/confirmadas',       [CitaController::class, 'confirmadas'])->middleware($auth);
$router->get   ('/api/citas/pendientes',        [CitaController::class, 'pendientes'])->middleware($auth);
$router->get   ('/api/citas/buscar',            [CitaController::class, 'buscar'])->middleware($auth);
$router->get   ('/api/citas/reporte-atenciones',[CitaController::class, 'cantidadAtenciones'])->middleware($auth);
$router->get   ('/api/citas/externas',          [CitaController::class, 'externasIndex'])->middleware($auth);
$router->get   ('/api/citas/rango',             [CitaController::class, 'rango'])->middleware($auth);
$router->get   ('/api/citas/{id}',              [CitaController::class, 'show'])->middleware($auth);
$router->post  ('/api/citas',                   [CitaController::class, 'store'])->middleware($csrf);
$router->put   ('/api/citas/{id}',              [CitaController::class, 'update'])->middleware($csrf);
$router->delete('/api/citas/{id}',              [CitaController::class, 'anular'])->middleware($csrf);
$router->post  ('/api/citas/externas',          [CitaController::class, 'storeExterna'])->middleware($csrf);
$router->delete('/api/citas/externas/{id}',     [CitaController::class, 'anularExterna'])->middleware($csrf);

// Caja
$router->get ('/api/caja/verificar',         [CajaController::class, 'verificar'])->middleware($auth);
$router->get ('/api/caja/gastos',            [CajaController::class, 'gastos'])->middleware($auth);
$router->get ('/api/caja/ultimos-ingresos',  [CajaController::class, 'ultimosIngresos'])->middleware($auth);
$router->get ('/api/caja/montos',            [CajaController::class, 'montos'])->middleware($auth);
$router->get ('/api/caja/movimiento-cuenta', [CajaController::class, 'movimientoCuenta'])->middleware($auth);
$router->post('/api/caja/aperturar',         [CajaController::class, 'aperturar'])->middleware($csrf);
$router->post('/api/caja/cerrar',            [CajaController::class, 'cerrar'])->middleware($csrf);
$router->post('/api/caja/gasto',             [CajaController::class, 'registrarGasto'])->middleware($csrf);
$router->post('/api/caja/pago',              [CajaController::class, 'registrarPago'])->middleware($csrf);

// Atenciones
$router->get   ('/api/atenciones',                  [AtencionController::class, 'index'])->middleware($auth);
$router->get   ('/api/atenciones/paciente',         [AtencionController::class, 'porPaciente'])->middleware($auth);
$router->get   ('/api/atenciones/antecedentes',     [AtencionController::class, 'antecedentesGenerales'])->middleware($auth);
$router->get   ('/api/atenciones/{id}',             [AtencionController::class, 'show'])->middleware($auth);
$router->get   ('/api/atenciones/{id}/signos',      [AtencionController::class, 'signosVitales'])->middleware($auth);
$router->post  ('/api/atenciones/guardar',          [AtencionController::class, 'store'])->middleware($csrf);
$router->post  ('/api/atenciones/signos',           [AtencionController::class, 'registrarSignos'])->middleware($csrf);

// Diagnósticos CIE-10
$router->get   ('/api/cie10/buscar',                [Cie10Controller::class, 'buscar'])->middleware($auth);

// Procedimientos
$router->get   ('/api/procedimientos',        [ProcedimientoController::class, 'index'])->middleware($auth);
$router->get   ('/api/procedimientos/buscar', [ProcedimientoController::class, 'buscarNombre'])->middleware($auth);
$router->post  ('/api/procedimientos',        [ProcedimientoController::class, 'store'])->middleware($csrf);
$router->put   ('/api/procedimientos/{id}',   [ProcedimientoController::class, 'update'])->middleware($csrf);
$router->delete('/api/procedimientos/{id}',   [ProcedimientoController::class, 'destroy'])->middleware($csrf);

// Medicamentos
$router->get   ('/api/medicamentos',           [MedicamentoController::class, 'index'])->middleware($auth);
$router->get   ('/api/medicamentos/nombres',   [MedicamentoController::class, 'nombres'])->middleware($auth);
$router->get   ('/api/medicamentos/buscar',    [MedicamentoController::class, 'buscarNombre'])->middleware($auth);
$router->post  ('/api/medicamentos',           [MedicamentoController::class, 'store'])->middleware($csrf);
$router->put   ('/api/medicamentos/{id}',      [MedicamentoController::class, 'update'])->middleware($csrf);
$router->delete('/api/medicamentos/{id}',      [MedicamentoController::class, 'destroy'])->middleware($csrf);
$router->post  ('/api/medicamentos/movimiento',[MedicamentoController::class, 'registrarMovimiento'])->middleware($csrf);

// Examenes
$router->get   ('/api/examenes',                            [ExamenesController::class, 'index'])->middleware($auth);
$router->get   ('/api/examenes/{id}',                       [ExamenesController::class, 'show'])->middleware($auth);
$router->get   ('/api/examenes/{id}/imagenes',              [ExamenesController::class, 'showImagenes'])->middleware($auth);
$router->post  ('/api/examenes/subir-imagenes',             [ExamenesController::class, 'storeImgs'])->middleware($csrf);
$router->post  ('/api/examenes/subir-pdf',                  [ExamenesController::class, 'storePdf'])->middleware($csrf);
$router->delete('/api/examenes/{id}',                       [ExamenesController::class, 'destroy'])->middleware($csrf);
$router->get   ('/uploads/{type}/{dni}/{filename}',         [ExamenesController::class, 'serveFile'])->middleware($auth);

// Establecimientos
$router->get ('/api/establecimientos',                 [EstablecimientoController::class, 'index'])->middleware($auth);
$router->get ('/api/establecimientos/tipo-atenciones', [EstablecimientoController::class, 'tipoAtenciones'])->middleware($auth);
$router->post('/api/establecimientos',                 [EstablecimientoController::class, 'store'])->middleware($csrf);

// Reportes
$router->get('/api/reportes/movimientos', [ReporteController::class, 'movimientos'])->middleware($auth);
$router->get('/api/reportes/kardex',      [ReporteController::class, 'kardex'])->middleware($auth);

// PDFs
$router->get('/pdf/receta/{id}',          [PdfController::class, 'receta'])->middleware($auth);
$router->get('/pdf/ticket/{id}',          [PdfController::class, 'ticket'])->middleware($auth);
$router->get('/pdf/reportes/movimientos', [PdfController::class, 'movimientos'])->middleware($auth);
$router->get('/pdf/reportes/externos',    [PdfController::class, 'externos'])->middleware($auth);

// POS Tickets
$router->get('/pos/ticket/{id}/preview',  [PosController::class, 'preview'])->middleware($auth);
$router->post('/pos/ticket/{id}/print',   [PosController::class, 'print'])->middleware($auth);
