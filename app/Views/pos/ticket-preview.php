<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Preview — Ticket POS</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
            background: #f5f5f5;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            padding: 24px;
        }

        .container { max-width: 480px; margin: 0 auto; }

        .card {
            background: #fff;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,.1);
            overflow: hidden;
        }

        .card-header {
            padding: 16px 20px;
            border-bottom: 1px solid #e9ecef;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .card-header h1 { font-size: 17px; color: #333; }

        .actions { display: flex; gap: 8px; }

        button {
            padding: 8px 16px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 13px;
            font-weight: 500;
            transition: opacity .2s;
        }

        button:hover  { opacity: .85; }
        button:disabled { opacity: .5; cursor: not-allowed; }

        .btn-refresh { background: #6c757d; color: #fff; }
        .btn-print   { background: #28a745; color: #fff; }

        .card-body { padding: 20px; }

        .ticket-wrap {
            background: #f0f0f0;
            border-radius: 4px;
            padding: 16px;
        }

        .alert {
            padding: 12px 16px;
            border-radius: 4px;
            font-size: 13px;
            margin-bottom: 16px;
            display: none;
        }

        .alert-success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
        .alert-error   { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }

        .spinner-wrap {
            display: none;
            text-align: center;
            padding: 16px;
        }

        .spinner {
            border: 3px solid #e0e0e0;
            border-top-color: #28a745;
            border-radius: 50%;
            width: 28px;
            height: 28px;
            animation: spin .8s linear infinite;
            margin: 0 auto 8px;
        }

        .spinner-wrap p { font-size: 13px; color: #666; }

        @keyframes spin { to { transform: rotate(360deg); } }
    </style>
</head>
<body>
<div class="container">
    <div class="card">
        <div class="card-header">
            <h1>Preview — Ticket POS</h1>
            <div class="actions">
                <button class="btn-refresh" onclick="location.reload()">&#8635; Actualizar</button>
                <button class="btn-print" id="btnPrint" onclick="imprimirTicket()">&#128438; Imprimir</button>
            </div>
        </div>

        <div class="card-body">
            <div class="alert alert-success" id="alertOk"></div>
            <div class="alert alert-error"   id="alertErr"></div>

            <div class="spinner-wrap" id="spinner">
                <div class="spinner"></div>
                <p>Imprimiendo...</p>
            </div>

            <div class="ticket-wrap">
                <?php echo $html; ?>
            </div>
        </div>
    </div>
</div>

<script>
    // ID de cita inyectado desde PHP — evita parsear la URL (evita el bug de pop())
    const CITA_ID = <?php echo (int) $idCita; ?>;

    function imprimirTicket() {
        const btn     = document.getElementById('btnPrint');
        const alertOk = document.getElementById('alertOk');
        const alertErr = document.getElementById('alertErr');
        const spinner = document.getElementById('spinner');

        btn.disabled = true;
        alertOk.style.display = 'none';
        alertErr.style.display = 'none';
        spinner.style.display  = 'block';

        fetch(`/pos/ticket/${CITA_ID}/print`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
            },
        })
        .then(r => r.json())
        .then(data => {
            spinner.style.display = 'none';
            btn.disabled = false;

            if (data.success) {
                alertOk.textContent = '&#10003; Ticket impreso correctamente.';
                alertOk.style.display = 'block';
            } else {
                alertErr.textContent = '&#10007; ' + (data.error ?? 'Error desconocido.');
                alertErr.style.display = 'block';
            }
        })
        .catch(err => {
            spinner.style.display = 'none';
            btn.disabled = false;
            alertErr.textContent = '&#10007; Error de conexión: ' + err.message;
            alertErr.style.display = 'block';
        });
    }
</script>
</body>
</html>
