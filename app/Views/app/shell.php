<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="csrf-token" content="<?= htmlspecialchars(\App\Core\Auth::csrfToken()) ?>" />
  <meta name="user-cargo" content="<?= (int) $cargo ?>" />
  <meta name="user-id"    content="<?= htmlspecialchars((string)$iduser) ?>" />
  <meta name="user-name"  content="<?= htmlspecialchars($nombre) ?>" />
  <title>Gastromedik</title>
  <link rel="icon" type="image/png" href="/assets/img/favicon.png" />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/assets/css/estilos.css?v=<?= filemtime(PUBLIC_PATH . '/assets/css/estilos.css') ?>" />
  <!-- Tipos de pago disponibles para el módulo de caja -->
  <script>
    window.__TIPOS_PAGO__ = <?= json_encode($tiposPago, JSON_UNESCAPED_UNICODE) ?>;
  </script>
</head>
<body>

  <!-- HEADER -->
  <header id="app-header">
    <div class="cont-menu-responsive">
      <button id="btn-toggle" aria-label="Menú" class="icon-btn">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <line x1="3" y1="6" x2="21" y2="6"/>
          <line x1="3" y1="12" x2="21" y2="12"/>
          <line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>
    </div>
    <div class="cont-logo">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 429.54 446.29">
        <path fill="#3867d6" d="M0,0V214.53H202.48S209,185,195,126c0,0-38.82-112-18.41-126Z"/>
        <path fill="#f7b731" d="M0,229.82V335.71s15.5-42.21,56.5-42.21,141,51.65,147.49-63.68Z"/>
        <path fill="#ccae62" d="M223.66,0H429.54V214.53h-53s7.18-82.21-49.91-94.12S215.81,159.5,223.66,0Z"/>
        <path fill="#3867d6" d="M429.54,229.82V446.29H222.89V415.71s166.8-46.56,153.71-185.89Z"/>
        <path fill="#f7b731" d="M204,446.29V420.41s-35.49,20.09-89.49-13.91-50-60-74-50,30.21,89.79,30.21,89.79Z"/>
        <path fill="#f7b731" d="M0,400.31v46H15.42S-.49,429.13,0,400.31Z"/>
      </svg>
      <span>Gastro-Medik</span>
    </div>
    <div class="cont-sesion">
      <p id="app-username"><?= htmlspecialchars($nombre) ?></p>
      <button id="btn-logout" class="icon-btn btn-off" aria-label="Cerrar sesión" title="Cerrar sesión">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
          <polyline points="16 17 21 12 16 7"/>
          <line x1="21" y1="12" x2="9" y2="12"/>
        </svg>
      </button>
    </div>
  </header>

  <!-- LAYOUT -->
  <div class="wrapper">

    <!-- SIDEBAR -->
    <aside id="app-sidebar">
      <div class="sidebar-logo">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 429.54 446.29">
          <path fill="#3867d6" d="M0,0V214.53H202.48S209,185,195,126c0,0-38.82-112-18.41-126Z"/>
          <path fill="#f7b731" d="M0,229.82V335.71s15.5-42.21,56.5-42.21,141,51.65,147.49-63.68Z"/>
          <path fill="#ccae62" d="M223.66,0H429.54V214.53h-53s7.18-82.21-49.91-94.12S215.81,159.5,223.66,0Z"/>
          <path fill="#3867d6" d="M429.54,229.82V446.29H222.89V415.71s166.8-46.56,153.71-185.89Z"/>
          <path fill="#f7b731" d="M204,446.29V420.41s-35.49,20.09-89.49-13.91-50-60-74-50,30.21,89.79,30.21,89.79Z"/>
        </svg>
      </div>
      <span class="sidebar-brand">Gastro-Medik</span>
      <nav id="app-nav" aria-label="Menú principal">
        <!-- Generado por sidebar.js -->
      </nav>
    </aside>

    <!-- CONTENIDO PRINCIPAL -->
    <main id="app-content" class="contenido" role="main">
      <div class="state-loading">
        <div class="spinner"></div>
        <p>Cargando...</p>
      </div>
    </main>

  </div>

  <!-- MODAL GLOBAL -->
  <div id="modal-overlay" class="modal-overlay" hidden aria-modal="true" role="dialog">
    <div id="modal-box" class="modal-box">
      <button id="modal-close" class="modal-close icon-btn" aria-label="Cerrar">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
      <div id="modal-content"></div>
    </div>
  </div>

  <!-- TOAST -->
  <div id="toast-container" aria-live="polite"></div>

  <script>
    (function(){
      var files = <?php
        $jsFiles = array_merge(
          [PUBLIC_PATH . '/assets/js/app.js'],
          glob(PUBLIC_PATH . '/assets/js/views/*.js') ?: [],
          glob(PUBLIC_PATH . '/assets/js/utils/*.js') ?: [],
          glob(PUBLIC_PATH . '/assets/js/components/*.js') ?: []
        );
        $times = array_map('filemtime', array_filter($jsFiles, 'file_exists'));
        echo (count($times) ? max($times) : time());
      ?>;
      window.__V__ = files;
    })();
  </script>
  <script type="module" src="/assets/js/app.js?v=<?= filemtime(PUBLIC_PATH . '/assets/js/app.js') ?>"></script>
</body>
</html>
