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

// ============ TRANSICIÓN CINEMATOGRÁFICA ENTRE PESTAÑAS ============
// Un barrido navy/dorado cubre toda la pantalla, muestra brevemente el
// nombre de la sección a la que se entra y se retira, mientras que por
// debajo (oculto) ya cambiamos el panel activo. Así cada cambio de
// pestaña se siente como una escena nueva, no como un simple show/hide.
const tabTransition = document.getElementById('tabTransition');
const ttIndexEl = document.getElementById('ttIndex');
const ttNameEl = document.getElementById('ttName');
let ttTimers = [];

function prefersReducedMotion(){
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function runTabTransition(targetBtn, onCovered){
  if(!tabTransition || prefersReducedMotion()){
    onCovered();
    return;
  }
  const indexText = targetBtn.querySelector('.tab-index')?.textContent || '';
  const nameText = targetBtn.querySelector('.tab-name')?.textContent || '';
  if(ttIndexEl) ttIndexEl.textContent = indexText;
  if(ttNameEl) ttNameEl.textContent = nameText;

  ttTimers.forEach(t => clearTimeout(t));
  ttTimers = [];

  tabTransition.classList.remove('tt-run');
  tabTransition.classList.add('tt-active');
  void tabTransition.offsetWidth; // fuerza reflow para reiniciar la animación
  tabTransition.classList.add('tt-run');

  const SWEEP_TOTAL = 780;   // debe calzar con la duración de ttSweep en CSS
  const COVER_POINT = 370;   // instante en que la pantalla queda totalmente cubierta

  ttTimers.push(setTimeout(onCovered, COVER_POINT));
  ttTimers.push(setTimeout(() => {
    tabTransition.classList.remove('tt-active', 'tt-run');
  }, SWEEP_TOTAL + 20));
}

function activateTab(tabName, { scroll = true, animate = true } = {}){
  const targetBtn = document.getElementById('tabbtn-' + tabName);
  if(!targetBtn) return;
  if(targetBtn.classList.contains('active')) return;

  function swapContent(){
    tabButtons.forEach(b => {
      const isMatch = b.dataset.tab === tabName;
      b.classList.toggle('active', isMatch);
      b.setAttribute('aria-selected', isMatch ? 'true' : 'false');
    });
    panels.forEach(p => p.classList.toggle('active', p.id === tabName));
    moveSlider(targetBtn);
    history.replaceState(null, '', '#' + tabName);
  }

  if(scroll){
    document.querySelector('.ficha-wrap')?.scrollIntoView({ behavior:'smooth', block:'start' });
  }

  if(animate){
    runTabTransition(targetBtn, swapContent);
  } else {
    swapContent();
  }
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
  const valid = ['nosotros','admision','afterschool','galeria','noticias','contacto'];
  if(valid.includes(initial) && initial !== 'nosotros'){
    activateTab(initial, { scroll:false, animate:false });
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

// ============ GALERÍAS / LIGHTBOX ============
// Hay dos galerías separadas. Para agregar o reordenar fotos en cualquiera
// de las dos: solo edita la lista correspondiente. El orden en que aparecen
// aquí es el orden en que se muestran en la página.
// "src" apunta al archivo dentro de img/galeria/ (mismo nombre que el archivo subido).

// Galería de After School (dentro de la pestaña After School)
const AFTER_SCHOOL_GALLERY = [
  { src: 'img/galeria/01-rincon-de-juego.jpg',              caption: 'Rincón de Juego' },
  { src: 'img/galeria/02-rincon-de-juego-mesas.jpg',        caption: 'Rincón de Juego' },
  { src: 'img/galeria/08-ordenando-rincon-de-juego.jpg',    caption: 'Ordenando el Rincón de Juego' },
  { src: 'img/galeria/03-rincon-del-arte.jpg',              caption: 'Rincón del Arte' },
  { src: 'img/galeria/04-hora-del-cuento.jpg',              caption: 'Hora del cuento' },
  { src: 'img/galeria/05-area-de-descanso.jpg',             caption: 'Área de descanso' },
  { src: 'img/galeria/06-espacio-after-school.jpg',         caption: 'Espacio After School' },
  { src: 'img/galeria/07-preparando-las-salas.jpg',         caption: 'Preparando las actividades' },
];

// Galería general del Liceo (pestaña Galería) — fotos de ejemplo, reemplázalas
// subiendo los archivos a img/galeria-liceo/ y editando esta lista.
const LICEO_GALLERY = [
  { src: 'img/galeria-liceo/01-fachada.jpg',           caption: 'Fachada del liceo' },
  { src: 'img/galeria-liceo/02-salas-de-clase.jpg',    caption: 'Salas de clase' },
  { src: 'img/galeria-liceo/03-laboratorio.jpg',       caption: 'Laboratorio de ciencias' },
  { src: 'img/galeria-liceo/04-talleres.jpg',          caption: 'Talleres técnicos' },
];

const fallbackClasses = ['g1','g2','g3','g4','g5','g6'];

function renderGalleryInto(containerId, list){
  const grid = document.getElementById(containerId);
  if(!grid) return;
  grid.innerHTML = '';
  list.forEach((photo, i) => {
    const btn = document.createElement('button');
    btn.className = 'gallery-item';
    btn.dataset.caption = photo.caption;
    btn.dataset.src = photo.src;

    const img = document.createElement('img');
    img.src = photo.src;
    img.alt = photo.caption;
    img.loading = 'lazy';
    // Si el archivo todavía no existe, se ve un degradado en vez de un ícono roto
    img.addEventListener('error', () => {
      btn.classList.add('g-fallback', fallbackClasses[i % fallbackClasses.length]);
    });

    const span = document.createElement('span');
    span.textContent = photo.caption;

    btn.append(img, span);
    grid.appendChild(btn);
  });
  wireGalleryClicks(grid, list);
}

const lightbox = document.getElementById('lightbox');
const lightboxCaption = document.getElementById('lightboxCaption');
const lightboxImg = document.getElementById('lightboxImg');
const lightboxClose = document.getElementById('lightboxClose');
const lightboxPrev = document.getElementById('lightboxPrev');
const lightboxNext = document.getElementById('lightboxNext');
let activeGalleryList = [];
let currentPhotoIndex = 0;

function wireGalleryClicks(grid, list){
  grid.querySelectorAll('.gallery-item').forEach((item, i) => {
    item.addEventListener('click', () => openLightbox(list, i));
  });
}

function openLightbox(list, index){
  activeGalleryList = list;
  currentPhotoIndex = index;
  showPhoto(currentPhotoIndex);
  lightbox.classList.add('open');
  lightbox.setAttribute('aria-hidden', 'false');
}

function showPhoto(index){
  const photo = activeGalleryList[index];
  if(!photo) return;
  lightboxCaption.textContent = photo.caption || '';
  lightboxImg.src = photo.src;
  lightboxImg.alt = photo.caption || '';
}

function showNext(){
  if(!activeGalleryList.length) return;
  currentPhotoIndex = (currentPhotoIndex + 1) % activeGalleryList.length;
  showPhoto(currentPhotoIndex);
}

function showPrev(){
  if(!activeGalleryList.length) return;
  currentPhotoIndex = (currentPhotoIndex - 1 + activeGalleryList.length) % activeGalleryList.length;
  showPhoto(currentPhotoIndex);
}

lightboxNext?.addEventListener('click', (e) => { e.stopPropagation(); showNext(); });
lightboxPrev?.addEventListener('click', (e) => { e.stopPropagation(); showPrev(); });

function closeLightbox(){
  lightbox.classList.remove('open');
  lightbox.setAttribute('aria-hidden', 'true');
}
lightboxClose?.addEventListener('click', closeLightbox);
lightbox?.addEventListener('click', (e) => { if(e.target === lightbox) closeLightbox(); });
document.addEventListener('keydown', (e) => {
  if(!lightbox.classList.contains('open')) return;
  if(e.key === 'Escape') closeLightbox();
  if(e.key === 'ArrowRight') showNext();
  if(e.key === 'ArrowLeft') showPrev();
});

renderGalleryInto('afterSchoolGallery', AFTER_SCHOOL_GALLERY);
renderGalleryInto('galleryGrid', LICEO_GALLERY);

// ============ NOTICIAS ============
// Para agregar una noticia: agrega un objeto a esta lista (arriba = más nueva).
const NEWS = [
  {
    date: '01 sept 2026',
    title: 'Inicio del proceso de admisión 2027',
    text: 'Ya está disponible el calendario de postulación para el próximo año escolar. Revisa los plazos en la pestaña Admisión.',
    color: 'g1',
  },
  {
    date: '18 ago 2026',
    title: 'Nuevos horarios de After School',
    text: 'A partir de este mes, After School amplía su horario de atención para los cursos menores.',
    color: 'g3',
  },
  {
    date: '05 ago 2026',
    title: 'Semana de la ciencia en el liceo',
    text: 'Nuestros estudiantes de laboratorio presentaron proyectos experimentales abiertos a toda la comunidad.',
    color: 'g2',
  },
];

function renderNews(){
  const grid = document.getElementById('newsGrid');
  if(!grid) return;
  grid.innerHTML = '';
  NEWS.forEach(item => {
    const card = document.createElement('article');
    card.className = 'news-card';

    const thumb = document.createElement('div');
    thumb.className = 'news-thumb ' + (item.color || 'g1');
    thumb.textContent = 'Liceo Gabriela Mistral';

    const body = document.createElement('div');
    body.className = 'news-body';
    body.innerHTML = `<span class="news-date">${item.date}</span><h3>${item.title}</h3><p>${item.text}</p>`;

    card.append(thumb, body);
    grid.appendChild(card);
  });
}
renderNews();

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