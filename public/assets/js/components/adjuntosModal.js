import { api } from '../utils/api.js'
import { openModal, closeModal } from './modal.js'
import { toastOk, toastError } from '../utils/toast.js'

export async function abrirAdjuntos(dni, nombrePaciente = '', { onDone } = {}) {
  const html = `
    <div class="m-adjuntos" style="padding: 10px 0;">
      <h2 class="modal-title" style="margin-bottom: 5px;">Adjuntar archivos</h2>
      <div style="font-size: 13px; color: var(--texto-secundario); margin-bottom: 20px;">
        ${nombrePaciente} · DNI ${dni}
      </div>

      <div class="drop" id="drop-adjuntos">
        <div class="ic">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
        </div>
        <p><b>Arrastra archivos aquí</b> o haz clic para seleccionar</p>
        <small>PDF e imágenes (PNG, JPG) · puedes mezclar varios a la vez</small>
        <input type="file" id="file-adjuntos" multiple accept="application/pdf,image/png,image/jpeg" style="display:none">
      </div>

      <div class="sec empty" id="sec-pdf">
        <div class="sec-h"><span class="t">📄 Documentos PDF</span><span class="count" id="c-pdf">0</span></div>
        <div id="pdf-list"></div>
      </div>

      <div class="sec empty" id="sec-img">
        <div class="sec-h"><span class="t">🖼 Imágenes</span><span class="count" id="c-img">0</span></div>
        <div class="img-name">
          <label>Nombre del examen (para el grupo de imágenes)</label>
          <input placeholder="Ej: Radiografía de tórax" id="img-name" autocomplete="off">
        </div>
        <div class="thumbs" id="thumbs"></div>
      </div>

      <p class="hint">Cada PDF se guarda como un examen independiente, por eso lleva su propio nombre. Las imágenes se agrupan en un solo examen con un nombre común. La fecha se asigna automáticamente al subir.</p>

      <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:20px;border-top:1px solid var(--gris-border);padding-top:16px;">
        <button class="btn-secundario" id="btn-cancel-adjuntos">Cancelar</button>
        <button class="btn-primario" id="btn-save-adjuntos" disabled>Guardar adjuntos</button>
      </div>
    </div>
  `;

  openModal(html);

  const drop = document.getElementById('drop-adjuntos');
  const file = document.getElementById('file-adjuntos');
  const secPdf = document.getElementById('sec-pdf');
  const secImg = document.getElementById('sec-img');
  const pdfList = document.getElementById('pdf-list');
  const thumbs = document.getElementById('thumbs');
  const cPdf = document.getElementById('c-pdf');
  const cImg = document.getElementById('c-img');
  const btnSave = document.getElementById('btn-save-adjuntos');

  let pdfs = [];
  let imgs = [];

  drop.onclick = () => file.click();
  ['dragover','dragenter'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('over'); }));
  ['dragleave','drop'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove('over'); }));
  drop.addEventListener('drop', e => {
    e.preventDefault();
    if (e.dataTransfer.files) handle(e.dataTransfer.files);
  });
  file.addEventListener('change', e => { handle(e.target.files); file.value = ''; });

  function handle(list) {
    let limitExceeded = false;
    [...list].forEach(f => {
      if (f.type === 'application/pdf') {
        if (!f.customName) f.customName = f.name.replace(/\.pdf$/i, '');
        pdfs.push(f);
      } else if (f.type === 'image/png' || f.type === 'image/jpeg') {
        if (imgs.length < 6) {
          imgs.push(f);
        } else {
          limitExceeded = true;
        }
      }
    });
    if (limitExceeded) toastError('Máximo 6 imágenes permitidas por vez.');
    render();
  }

  function render() {
    // PDF
    secPdf.classList.toggle('empty', !pdfs.length);
    cPdf.textContent = pdfs.length;
    
    pdfList.innerHTML = pdfs.map((f, i) => `
      <div class="pdf-item">
        <div class="pdf-ic">PDF</div>
        <div class="pdf-meta">
          <div class="pdf-fname">${f.name} · ${(f.size/1024).toFixed(0)} KB</div>
          <input type="text" placeholder="Nombre del examen (ej: Resultado laboratorio)" 
                 value="${f.customName}" 
                 data-i="${i}" class="pdf-name-input" autocomplete="off">
        </div>
        <button class="rm" data-t="pdf" data-i="${i}">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        </button>
      </div>`).join('');
      
    document.querySelectorAll('.pdf-name-input').forEach(inp => {
      inp.addEventListener('input', e => {
        pdfs[e.target.dataset.i].customName = e.target.value;
      });
    });

    // IMG
    secImg.classList.toggle('empty', !imgs.length);
    cImg.textContent = imgs.length;
    thumbs.innerHTML = '';
    imgs.forEach((f, i) => {
      const r = new FileReader();
      r.onload = () => {
        const d = document.createElement('div');
        d.className = 'thumb';
        d.innerHTML = `<img src="${r.result}"><button class="rmx" data-t="img" data-i="${i}">✕</button>`;
        thumbs.appendChild(d);
      };
      r.readAsDataURL(f);
    });

    btnSave.disabled = !pdfs.length && !imgs.length;
  }

  document.getElementById('btn-cancel-adjuntos').addEventListener('click', closeModal);

  document.querySelector('.m-adjuntos').addEventListener('click', e => {
    const b = e.target.closest('[data-t]');
    if (!b) return;
    const i = +b.dataset.i;
    if (b.dataset.t === 'pdf') {
      pdfs.splice(i, 1);
    } else {
      imgs.splice(i, 1);
    }
    render();
  });

  btnSave.addEventListener('click', async () => {
    let valid = true;
    if (pdfs.length > 0) {
      document.querySelectorAll('.pdf-name-input').forEach(inp => {
        if (!inp.value.trim()) valid = false;
      });
    }
    const imgNameInput = document.getElementById('img-name');
    if (imgs.length > 0 && !imgNameInput.value.trim()) valid = false;

    if (!valid) {
      toastError('Complete los nombres de todos los exámenes.');
      return;
    }

    btnSave.disabled = true;
    btnSave.classList.add('btn-loading');

    const csrf = document.querySelector('meta[name="csrf-token"]')?.content ?? '';
    const promises = [];

    // Promise for PDFs
    pdfs.forEach((f, i) => {
      const fd = new FormData();
      fd.append('idpaciente', dni);
      fd.append('nombreexamen', f.customName);
      fd.append('mi-archivo', f);
      promises.push(
        fetch('/api/examenes/subir-pdf', {
          method: 'POST',
          headers: { 'X-CSRF-Token': csrf },
          body: fd
        }).then(async r => {
          if (!r.ok) {
            const j = await r.json().catch(()=>({}));
            throw new Error(j.error || 'Error PDF');
          }
        })
      );
    });

    // Promise for IMGs
    if (imgs.length > 0) {
      const fd = new FormData();
      fd.append('idpaciente', dni);
      fd.append('nombreexamen', imgNameInput.value.trim());
      imgs.forEach((f, i) => {
        fd.append(`foto${i+1}`, f);
      });
      promises.push(
        fetch('/api/examenes/subir-imagenes', {
          method: 'POST',
          headers: { 'X-CSRF-Token': csrf },
          body: fd
        }).then(async r => {
          if (!r.ok) {
            const j = await r.json().catch(()=>({}));
            throw new Error(j.error || 'Error IMG');
          }
        })
      );
    }

    try {
      const results = await Promise.allSettled(promises);
      const fails = results.filter(r => r.status === 'rejected');
      
      if (fails.length === 0) {
        toastOk('Adjuntos guardados correctamente.');
        closeModal();
        if (onDone) onDone();
      } else if (fails.length === promises.length) {
        toastError('No se pudo guardar ningún adjunto.');
      } else {
        toastError(`Se guardaron algunos adjuntos, pero fallaron ${fails.length}.`);
        closeModal();
        if (onDone) onDone();
      }
    } catch (err) {
      toastError('Error al guardar adjuntos.');
    } finally {
      btnSave.classList.remove('btn-loading');
      btnSave.disabled = false;
    }
  });
}
