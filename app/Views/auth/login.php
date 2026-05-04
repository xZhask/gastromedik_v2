<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Gastromedik — Iniciar sesión</title>
  <link rel="icon" type="image/png" href="/assets/img/favicon.png" />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/assets/css/estilos.css" />
</head>
<body class="login-body">

  <main class="login-shell">

    <!-- Panel de marca (izquierda en desktop) -->
    <aside class="login-brand">
      <div class="login-brand__decor login-brand__decor--1"></div>
      <div class="login-brand__decor login-brand__decor--2"></div>

      <div class="login-brand__inner">
        <div class="login-brand__logo">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 429.54 446.29" aria-label="Gastromedik">
            <path fill="#3867d6" d="M0,0V214.53H202.48S209,185,195,126c0,0-38.82-112-18.41-126Z"/>
            <path fill="#f7b731" d="M0,229.82V335.71s15.5-42.21,56.5-42.21,141,51.65,147.49-63.68Z"/>
            <path fill="#ccae62" d="M223.66,0H429.54V214.53h-53s7.18-82.21-49.91-94.12S215.81,159.5,223.66,0Z"/>
            <path fill="#3867d6" d="M429.54,229.82V446.29H222.89V415.71s166.8-46.56,153.71-185.89Z"/>
            <path fill="#f7b731" d="M204,446.29V420.41s-35.49,20.09-89.49-13.91-50-60-74-50,30.21,89.79,30.21,89.79Z"/>
            <path fill="#f7b731" d="M0,400.31v46H15.42S-.49,429.13,0,400.31Z"/>
          </svg>
        </div>
        <h1 class="login-brand__name">Gastro-Medik</h1>
        <p class="login-brand__tagline">Sistema integral de gestión<br />para clínicas gastroenterológicas</p>

        <ul class="login-brand__features">
          <li>
            <span class="login-brand__feature-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
            </span>
            <span>Historias clínicas centralizadas</span>
          </li>
          <li>
            <span class="login-brand__feature-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            </span>
            <span>Agenda, atenciones y caja en un solo lugar</span>
          </li>
          <li>
            <span class="login-brand__feature-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </span>
            <span>Datos seguros y trazables</span>
          </li>
        </ul>
      </div>
    </aside>

    <!-- Panel del formulario (derecha en desktop) -->
    <section class="login-panel">
      <div class="login-card">

        <header class="login-card__head">
          <h2>Iniciar sesión</h2>
          <p>Ingrese sus credenciales para continuar</p>
        </header>

        <!-- Mensaje de error inline (oculto por defecto) -->
        <div class="login-alert" id="login-alert" role="alert" hidden>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <span id="login-alert-msg"></span>
        </div>

        <form class="login-form" id="frmlogin" method="post" autocomplete="off" novalidate>
          <div class="login-field">
            <label for="user">Usuario</label>
            <div class="login-field__input">
              <span class="login-field__icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </span>
              <input type="text" name="user" id="user" placeholder="usuario" autocomplete="username" required />
            </div>
          </div>

          <div class="login-field">
            <label for="pass">Contraseña</label>
            <div class="login-field__input">
              <span class="login-field__icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              </span>
              <input type="password" name="pass" id="pass" placeholder="••••••••" autocomplete="current-password" required />
              <button type="button" class="login-field__toggle" id="btn-toggle-pass" aria-label="Mostrar contraseña" tabindex="-1">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              </button>
            </div>
          </div>

          <button type="submit" class="login-submit" id="btn-login">
            <span class="login-submit__label">Ingresar</span>
            <span class="login-submit__spinner" aria-hidden="true"></span>
          </button>
        </form>

      </div>

      <footer class="login-footer">
        <span>&copy; <?= date('Y') ?> Gastro-Medik</span>
        <span class="login-footer__sep">·</span>
        <span>v2.0</span>
      </footer>
    </section>

  </main>

  <script src="/assets/js/login.js"></script>
</body>
</html>
