// ============================================================
// LÓGICA COMPARTIDA DE LOS FORMULARIOS DE CONTACTO
// La usan contacto.html y contacto-afterschool.html. Antes cada
// página tenía su propia copia casi idéntica de este código; ahora
// viven aquí y cada página solo define su configuración particular
// (ids de los campos del formulario, destinatarios y textos).
// ============================================================

// Rellena los correos que se muestran en pantalla (spans .js-email con
// data-user y data-domain, para no dejar la dirección completa como texto plano).
function fillContactEmails(){
  document.querySelectorAll('.js-email').forEach(el => {
    const user = el.dataset.user, domain = el.dataset.domain;
    if(user && domain) el.textContent = `${user}@${domain}`;
  });
}

// Actualiza el año del footer automáticamente cada año.
function fillContactYear(){
  document.querySelectorAll('.js-year').forEach(el => { el.textContent = new Date().getFullYear(); });
}

function setContactFieldError(input, message){
  input.classList.toggle('invalid', Boolean(message));
  const msgEl = input.closest('.field')?.querySelector('.field-msg');
  if(msgEl) msgEl.textContent = message || '';
}

function validateContactField(input){
  if(input.validity.valueMissing){
    setContactFieldError(input, 'Este campo es obligatorio.');
    return false;
  }
  if(input.type === 'email' && input.validity.typeMismatch){
    setContactFieldError(input, 'Ingresa un correo válido.');
    return false;
  }
  setContactFieldError(input, '');
  return true;
}

/**
 * Inicializa un formulario de contacto genérico.
 * @param {Object} config
 * @param {string}   config.formId          id del <form>
 * @param {string}   config.successId       id del <p> de mensaje de éxito
 * @param {string}   config.fallbackId      id del bloque de respaldo (se muestra si mailto no abrió nada)
 * @param {string[]} config.requiredFieldIds ids de los campos obligatorios a validar (nombre, correo, mensaje…)
 * @param {string}   config.nameFieldId     id del campo de nombre
 * @param {string}   config.emailFieldId    id del campo de correo
 * @param {string}   [config.subjectFieldId] id del campo de asunto (opcional)
 * @param {string}   config.messageFieldId  id del campo de mensaje
 * @param {string[]} config.destinatarios   correos que reciben el mensaje (mailto admite varios separados por coma)
 * @param {(nombre:string, asunto:string) => string} config.buildSubject  arma el asunto del correo
 * @param {(nombre:string, correo:string, asunto:string, mensaje:string) => string} config.buildBody  arma el cuerpo del correo
 * @param {string}   [config.web3formsKey]  Access Key de web3forms.com (opcional, ver nota abajo)
 * @param {string}   config.successMsgMailto mensaje mostrado tras abrir la app de correo
 * @param {string}   config.successMsgWeb3   mensaje mostrado tras un envío directo exitoso
 */
function initContactForm(config){
  const form = document.getElementById(config.formId);
  if(!form) return;

  const successEl = document.getElementById(config.successId);
  const fallbackEl = config.fallbackId ? document.getElementById(config.fallbackId) : null;

  config.requiredFieldIds.forEach(id => {
    const input = document.getElementById(id);
    input.addEventListener('blur', () => validateContactField(input));
    input.addEventListener('input', () => {
      if(input.classList.contains('invalid')) validateContactField(input);
    });
  });

  function sendByMailto(nombre, correo, asunto, mensaje){
    const asuntoCorreo = config.buildSubject(nombre, asunto);
    const cuerpoCorreo = config.buildBody(nombre, correo, asunto, mensaje);

    const mailtoUrl = `mailto:${config.destinatarios.join(',')}` +
      `?subject=${encodeURIComponent(asuntoCorreo)}` +
      `&body=${encodeURIComponent(cuerpoCorreo)}`;

    window.location.href = mailtoUrl;
    successEl.textContent = config.successMsgMailto;

    // Si el navegador no tiene una app de correo asociada (frecuente en celulares),
    // no pasa nada visible. Mostramos una alternativa por si acaso, unos segundos después.
    if(fallbackEl){
      clearTimeout(form._fallbackTimer);
      form._fallbackTimer = setTimeout(() => { fallbackEl.hidden = false; }, 2500);
    }
  }

  async function sendByWeb3Forms(nombre, correo, asunto, mensaje, submitBtn){
    submitBtn.disabled = true;
    submitBtn.textContent = 'Enviando…';
    try{
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_key: config.web3formsKey,
          subject: config.buildSubject(nombre, asunto),
          name: nombre,
          email: correo,
          message: mensaje,
        }),
      });
      const data = await res.json();
      if(data.success){
        successEl.textContent = config.successMsgWeb3;
      } else {
        sendByMailto(nombre, correo, asunto, mensaje);
      }
    }catch(err){
      // Sin conexión o el servicio no respondió: usamos el correo como respaldo.
      sendByMailto(nombre, correo, asunto, mensaje);
    }finally{
      submitBtn.disabled = false;
      submitBtn.textContent = 'Enviar mensaje';
    }
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const fields = config.requiredFieldIds.map(id => document.getElementById(id));
    const allValid = fields.map(validateContactField).every(Boolean);

    if(!allValid){
      successEl.textContent = '';
      fields.find(f => f.classList.contains('invalid'))?.focus();
      return;
    }

    const nombre = document.getElementById(config.nameFieldId).value.trim();
    const correo = document.getElementById(config.emailFieldId).value.trim();
    const asunto = config.subjectFieldId ? document.getElementById(config.subjectFieldId).value.trim() : '';
    const mensaje = document.getElementById(config.messageFieldId).value.trim();
    const submitBtn = form.querySelector('button[type="submit"]');

    if(config.web3formsKey){
      sendByWeb3Forms(nombre, correo, asunto, mensaje, submitBtn);
    } else {
      sendByMailto(nombre, correo, asunto, mensaje);
    }

    form.reset();
    fields.forEach(f => setContactFieldError(f, ''));
  });

  // Botón "copiar correo" del bloque de respaldo (si la página lo trae).
  if(config.copyBtnId){
    document.getElementById(config.copyBtnId)?.addEventListener('click', async (e) => {
      const direccion = config.destinatarios[0];
      try{
        await navigator.clipboard.writeText(direccion);
        const original = config.copyBtnLabel || e.target.textContent;
        e.target.textContent = '¡Correo copiado!';
        e.target.classList.add('copied');
        setTimeout(() => { e.target.textContent = original; e.target.classList.remove('copied'); }, 2500);
      }catch(err){
        window.location.href = 'mailto:' + direccion;
      }
    });
  }
}

fillContactEmails();
fillContactYear();
