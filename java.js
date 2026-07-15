// ============ MENÚ MÓVIL ============
const burgerBtn = document.getElementById('burgerBtn');
const mainNav = document.getElementById('mainNav');
burgerBtn?.addEventListener('click', () => {
  mainNav.classList.toggle('open');
});

// ============ SISTEMA DE PESTAÑAS ============
const tabButtons = document.querySelectorAll('.tab-btn');
const panels = document.querySelectorAll('.panel');
const tabSlider = document.getElementById('tabSlider');
const tabsNav = document.getElementById('tabsNav');

function moveSlider(btn){
  if(!btn || !tabSlider) return;
  const navRect = tabsNav.getBoundingClientRect();
  const btnRect = btn.getBoundingClientRect();
  tabSlider.style.left = (btnRect.left - navRect.left) + 'px';
  tabSlider.style.width = btnRect.width + 'px';
}

function activateTab(tabName, { scroll = true } = {}){
  const targetBtn = document.getElementById('tabbtn-' + tabName);
  if(!targetBtn) return;

  tabButtons.forEach(b => {
    const isMatch = b.dataset.tab === tabName;
    b.classList.toggle('active', isMatch);
    b.setAttribute('aria-selected', isMatch ? 'true' : 'false');
  });
  panels.forEach(p => p.classList.toggle('active', p.id === tabName));
  moveSlider(targetBtn);

  if(scroll){
    document.querySelector('.ficha-wrap')?.scrollIntoView({ behavior:'smooth', block:'start' });
  }
  history.replaceState(null, '', '#' + tabName);
}

tabButtons.forEach(btn => {
  btn.addEventListener('click', () => activateTab(btn.dataset.tab));
});

// Cualquier elemento con data-goto navega a una pestaña
document.querySelectorAll('[data-goto]').forEach(el => {
  el.addEventListener('click', (e) => {
    e.preventDefault();
    activateTab(el.dataset.goto);
    mainNav?.classList.remove('open');
  });
});

// Estado inicial según el hash de la URL, si corresponde a una pestaña válida
window.addEventListener('load', () => {
  const initial = window.location.hash.replace('#','');
  const valid = ['nosotros','admision','afterschool','galeria','contacto'];
  if(valid.includes(initial)){
    activateTab(initial, { scroll:false });
  } else {
    moveSlider(document.querySelector('.tab-btn.active'));
  }
});
window.addEventListener('resize', () => {
  moveSlider(document.querySelector('.tab-btn.active'));
});

// ============ CONTADORES ANIMADOS ============
function animateCount(el, target, duration = 1400){
  const start = performance.now();
  function tick(now){
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(eased * target);
    if(progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

// Años del liceo en el eyebrow del hero
const yearsEl = document.getElementById('yearsCount');
if(yearsEl){
  const currentYear = new Date().getFullYear();
  animateCount(yearsEl, currentYear - 1950, 1200);
}

// Estadísticas de "Nosotros": se animan una sola vez, cuando la pestaña se abre
let statsAnimated = false;
function maybeAnimateStats(){
  if(statsAnimated) return;
  const nosotrosPanel = document.getElementById('nosotros');
  if(nosotrosPanel && nosotrosPanel.classList.contains('active')){
    document.querySelectorAll('.stat strong[data-count]').forEach(el => {
      animateCount(el, parseInt(el.dataset.count, 10));
    });
    statsAnimated = true;
  }
}
maybeAnimateStats();
document.getElementById('tabbtn-nosotros')?.addEventListener('click', () => setTimeout(maybeAnimateStats, 50));

// ============ PILARES (micro-interacción) ============
document.querySelectorAll('.pillar').forEach(p => {
  p.addEventListener('click', () => {
    p.animate(
      [{ transform:'scale(1)' }, { transform:'scale(0.97)' }, { transform:'scale(1)' }],
      { duration:220, easing:'ease-out' }
    );
  });
});

// ============ STEPPER DE ADMISIÓN (acordeón) ============
document.querySelectorAll('.step-head').forEach(head => {
  head.addEventListener('click', () => {
    const step = head.closest('.step');
    const wasOpen = step.classList.contains('open');
    document.querySelectorAll('.step').forEach(s => s.classList.remove('open'));
    if(!wasOpen) step.classList.add('open');
  });
});
// Abre el primer paso por defecto
document.querySelector('.step[data-step="1"]')?.classList.add('open');

// ============ GALERÍA / LIGHTBOX ============
const lightbox = document.getElementById('lightbox');
const lightboxCaption = document.getElementById('lightboxCaption');
const lightboxBox = document.getElementById('lightboxBox');
const lightboxClose = document.getElementById('lightboxClose');

document.querySelectorAll('.gallery-item').forEach(item => {
  item.addEventListener('click', () => {
    const caption = item.dataset.caption || '';
    lightboxCaption.textContent = caption;
    // Reutiliza el degradado de la miniatura para el fondo del lightbox
    const computed = getComputedStyle(item).backgroundImage;
    lightboxBox.style.background = computed && computed !== 'none'
      ? computed
      : 'linear-gradient(135deg, var(--blue), var(--navy))';
    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden', 'false');
  });
});

function closeLightbox(){
  lightbox.classList.remove('open');
  lightbox.setAttribute('aria-hidden', 'true');
}
lightboxClose?.addEventListener('click', closeLightbox);
lightbox?.addEventListener('click', (e) => { if(e.target === lightbox) closeLightbox(); });
document.addEventListener('keydown', (e) => { if(e.key === 'Escape') closeLightbox(); });

// ============ FORMULARIO DE CONTACTO ============
const contactForm = document.getElementById('contactForm');
const formSuccess = document.getElementById('formSuccess');

function setFieldError(input, message){
  input.classList.toggle('invalid', Boolean(message));
  const msgEl = input.closest('.field')?.querySelector('.field-msg');
  if(msgEl) msgEl.textContent = message || '';
}

function validateField(input){
  if(input.validity.valueMissing){
    setFieldError(input, 'Este campo es obligatorio.');
    return false;
  }
  if(input.type === 'email' && input.validity.typeMismatch){
    setFieldError(input, 'Ingresa un correo válido.');
    return false;
  }
  setFieldError(input, '');
  return true;
}

['fName','fEmail','fMessage'].forEach(id => {
  const input = document.getElementById(id);
  input?.addEventListener('blur', () => validateField(input));
  input?.addEventListener('input', () => {
    if(input.classList.contains('invalid')) validateField(input);
  });
});

contactForm?.addEventListener('submit', (e) => {
  e.preventDefault();
  const fields = ['fName','fEmail','fMessage'].map(id => document.getElementById(id));
  const allValid = fields.map(validateField).every(Boolean);

  if(!allValid){
    formSuccess.textContent = '';
    fields.find(f => f.classList.contains('invalid'))?.focus();
    return;
  }

  formSuccess.textContent = '¡Gracias! Tu mensaje quedó registrado (formulario de ejemplo — conéctalo a tu correo o backend).';
  contactForm.reset();
  fields.forEach(f => setFieldError(f, ''));
});