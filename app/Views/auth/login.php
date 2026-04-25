<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Gastromedik — Ingresar</title>
  <link rel="icon" type="image/png" href="/assets/img/favicon.png" />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/assets/css/estilos.css" />
</head>
<body>
  <div class="wrapper-login">
    <div class="cont-login">
      <div class="cont-logo">
        <img src="/assets/img/logoPlano-colores.png" alt="Gastromedik" />
      </div>
      <form class="formlogin" id="frmlogin" method="post" autocomplete="off">
        <h2>Inicio de Sesión</h2>
        <div class="form-control cont-user">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          <input type="text" name="user" id="user" placeholder="Usuario" autocomplete="username" />
        </div>
        <div class="form-control user">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          <input type="password" name="pass" id="pass" placeholder="Contraseña" autocomplete="current-password" />
        </div>
        <button type="submit">Ingresar</button>
      </form>
    </div>
  </div>
  <script src="/assets/js/login.js"></script>
</body>
</html>
