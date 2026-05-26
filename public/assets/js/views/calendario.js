import { api } from '../utils/api.js'
import { abrirFormCita, editarCita } from './citas.js'

const content = () => document.getElementById('app-content')

export async function CalendarioView() {
  content().innerHTML = `
    <div class="gm-page-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; margin-bottom:20px;">
      <div class="gm-page-header__title">
        <h1 style="font-size:1.4rem; color:var(--negro); margin:0;">Calendario de Citas</h1>
        <span class="gm-page-header__sub" id="calendar-title" style="color:var(--gris-dark); font-size:1rem; font-weight:600;"></span>
      </div>
      <div class="gm-page-header__actions" style="display:flex; gap:8px;">
        <button class="btn-secundario" id="cal-btn-prev">‹ Anterior</button>
        <button class="btn-secundario" id="cal-btn-today">Hoy</button>
        <button class="btn-secundario" id="cal-btn-next">Siguiente ›</button>
      </div>
    </div>
    
    <div class="gm-card" style="padding:10px; overflow:hidden;">
      <div id="calendar" style="height: calc(100vh - 180px);"></div>
    </div>
  `

  let CalendarApp = null;
  if (window.toastui && window.toastui.Calendar) {
    CalendarApp = window.toastui.Calendar;
  } else if (window.tui && window.tui.Calendar) {
    CalendarApp = window.tui.Calendar;
  } else if (window.Calendar) {
    CalendarApp = window.Calendar;
  }

  if (!CalendarApp) {
    console.error("ToastUI Calendar JS globals:", { tui: window.tui, toastui: window.toastui });
    document.getElementById('calendar').innerHTML = '<div style="padding:20px;color:red;text-align:center;">Error fatal: La librería del calendario no cargó correctamente (bloqueada por caché, red o AdBlock). Por favor presiona Ctrl+F5 para limpiar tu caché local.</div>';
    return;
  }

  const isDarkMode = document.body.getAttribute('data-theme') === 'dark';

  const calendar = new CalendarApp('#calendar', {
    defaultView: 'month',
    isReadOnly: true,
    useFormPopup: false,
    useDetailPopup: false,
    month: {
      dayNames: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
      startDayOfWeek: 1,
    },
    timezone: {
      zones: [{ timezoneName: 'America/Lima', displayLabel: 'Lima' }],
    },
    theme: isDarkMode ? {
        common: {
            backgroundColor: 'var(--superficie)',
            border: '1px solid var(--borde-sutil)',
            dayName: { color: 'var(--negro)' },
            holiday: { color: 'var(--rojo)' },
            saturday: { color: 'var(--azul)' },
            gridSelection: { backgroundColor: 'var(--azul-light)', border: '1px solid var(--azul)' }
        },
        month: {
            dayName: {
                borderLeft: '1px solid var(--borde-sutil)',
                backgroundColor: 'var(--superficie-2)'
            },
            dayExceptThisMonth: { color: 'var(--gris)' },
            holidayExceptThisMonth: { color: 'var(--rojo)' },
            weekend: { backgroundColor: 'var(--superficie)' }
        }
    } : {}
  });

  const fetchEvents = async () => {
    let startD = calendar.getDateRangeStart();
    let endD = calendar.getDateRangeEnd();
    
    const sD = startD.toDate ? startD.toDate() : new Date(startD);
    const eD = endD.toDate ? endD.toDate() : new Date(endD);
    const start = new Date(sD.getTime() - sD.getTimezoneOffset() * 60000).toISOString().split('T')[0];
    const end   = new Date(eD.getTime() - eD.getTimezoneOffset() * 60000).toISOString().split('T')[0];

    try {
      const res = await api.get('/api/citas/rango', { start, end })
      calendar.clear()
      
      const events = res.data.map(c => {
         let bg = '#74b9ff'; // Azul pastel - POR PAGAR
         if (c.estado === 'PAGADO') bg = '#55efc4'; // Verde pastel
         if (c.estado === 'A CUENTA') bg = '#ffeaa7'; // Amarillo pastel
         if (c.estado === 'ANULADO') bg = '#dfe6e9'; // Gris pastel
         
         const startStr = c.fecha + 'T' + c.horario;
         
         return {
           id: String(c.idcita),
           calendarId: 'citas',
           title: c.paciente + ' (' + c.motivo + ')',
           category: 'time',
           start: startStr,
           end: startStr,
           backgroundColor: bg,
           borderColor: bg,
           color: '#2d3436' // Texto oscuro para contrastar con los colores pastel
         }
      })
      calendar.createEvents(events)
      renderTitle()
    } catch(e) {
      console.error('Error cargando calendario', e)
    }
  }

  const renderTitle = () => {
    let d = calendar.getDate();
    let dateObj = d.toDate ? d.toDate() : new Date(d);
    const month = dateObj.getMonth();
    const year = dateObj.getFullYear();
    const map = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    document.getElementById('calendar-title').textContent = `${map[month]} ${year}`;
  }

  // Eventos de TOAST UI Calendar
  calendar.on('selectDateTime', (eventObj) => {
    let d = eventObj.start;
    let dateObj = d.toDate ? d.toDate() : new Date(d);
    const fechaClick = new Date(dateObj.getTime() - dateObj.getTimezoneOffset() * 60000).toISOString().split('T')[0];
    
    abrirFormCita(null, fechaClick, fetchEvents);
    calendar.clearGridSelections();
  });
  
  calendar.on('clickEvent', (e) => {
      editarCita(e.event.id, fetchEvents);
  });

  // Botones de navegación
  document.getElementById('cal-btn-prev').onclick = () => { calendar.prev(); fetchEvents(); }
  document.getElementById('cal-btn-next').onclick = () => { calendar.next(); fetchEvents(); }
  document.getElementById('cal-btn-today').onclick = () => { calendar.today(); fetchEvents(); }

  fetchEvents()
}
