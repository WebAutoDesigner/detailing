// ===== HEADER SCROLL =====
const header = document.getElementById('header');
const hero = document.getElementById('hero');

const onScroll = () => {
  const scrolled = window.scrollY > 80;
  header.classList.toggle('header--scrolled', scrolled);
};
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// ===== NAV DROPDOWNS (click to open, click outside to close) =====
document.querySelectorAll('.nav-item--dropdown').forEach(item => {
  const btn = item.querySelector('.nav-item__btn');
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = item.classList.contains('nav-item--open');
    document.querySelectorAll('.nav-item--dropdown').forEach(i => i.classList.remove('nav-item--open'));
    if (!isOpen) item.classList.add('nav-item--open');
  });
});

// Close on outside click
document.addEventListener('click', (e) => {
  if (!e.target.closest('.nav-item--dropdown')) {
    document.querySelectorAll('.nav-item--dropdown').forEach(i => i.classList.remove('nav-item--open'));
  }
});

// Services dropdown: hover service → show subservices
document.querySelectorAll('.dropdown__service-item').forEach((item, idx) => {
  item.addEventListener('mouseenter', () => {
    document.querySelectorAll('.dropdown__service-item').forEach(i => i.classList.remove('dropdown__service-item--active'));
    document.querySelectorAll('.dropdown__sub-list').forEach(l => l.classList.remove('dropdown__sub-list--active'));
    item.classList.add('dropdown__service-item--active');
    const sub = document.querySelector(`.dropdown__sub-list[data-sub="${idx}"]`);
    if (sub) sub.classList.add('dropdown__sub-list--active');
  });
});

// Show first subservice by default
const firstService = document.querySelector('.dropdown__service-item');
const firstSub = document.querySelector('.dropdown__sub-list[data-sub="0"]');
if (firstService) firstService.classList.add('dropdown__service-item--active');
if (firstSub) firstSub.classList.add('dropdown__sub-list--active');

// ===== HERO SLIDER =====
const slides = document.querySelectorAll('.hero__slide');
const counter = document.getElementById('heroCounter');
const prevBtn = document.getElementById('heroPrev');
const nextBtn = document.getElementById('heroNext');
let current = 0;

const goTo = (idx) => {
  slides[current].classList.remove('hero__slide--active');
  current = (idx + slides.length) % slides.length;
  slides[current].classList.add('hero__slide--active');
  if (counter) counter.textContent = `${current + 1} / ${slides.length}`;
};

if (prevBtn) prevBtn.addEventListener('click', () => goTo(current - 1));
if (nextBtn) nextBtn.addEventListener('click', () => goTo(current + 1));

// ===== REVIEWS SLIDER =====
const track = document.getElementById('reviewsTrack');
const rPrev = document.getElementById('reviewsPrev');
const rNext = document.getElementById('reviewsNext');

if (track) {
  let rIdx = 0;
  const cards = track.querySelectorAll('.review-card');
  const getVisible = () => window.innerWidth > 900 ? 4 : window.innerWidth > 768 ? 2 : 1;

  const rGoTo = (idx) => {
    const visible = getVisible();
    const max = Math.max(0, cards.length - visible);
    rIdx = Math.min(Math.max(idx, 0), max);
    const cardW = cards[0].offsetWidth + 20;
    track.style.transform = `translateX(-${rIdx * cardW}px)`;
  };

  if (rPrev) rPrev.addEventListener('click', () => rGoTo(rIdx - 1));
  if (rNext) rNext.addEventListener('click', () => rGoTo(rIdx + 1));
  window.addEventListener('resize', () => rGoTo(rIdx));
}

// ===== CONTACT FORM =====
function validatePhone(input) {
  const digits = input.value.replace(/\D/g, '');
  const normalized = digits.startsWith('8') ? '7' + digits.slice(1) : digits;
  const valid = /^7\d{10}$/.test(normalized);
  let errEl = input.nextElementSibling;
  if (!errEl || !errEl.classList.contains('field-error')) {
    errEl = document.createElement('span');
    errEl.className = 'field-error';
    input.after(errEl);
  }
  if (!valid) {
    input.classList.add('input--error');
    errEl.textContent = 'Введите номер в формате +7, 8 или 7 (11 цифр)';
  } else {
    input.classList.remove('input--error');
    errEl.textContent = '';
  }
  return valid;
}

async function submitForm(form, onSuccess) {
  const phoneInput = form.querySelector('input[type="tel"]');
  if (phoneInput && !validatePhone(phoneInput)) return;

  const agreeInput = form.querySelector('input[type="checkbox"]');
  if (agreeInput && !agreeInput.checked) {
    const label = agreeInput.closest('label');
    if (label) {
      label.style.color = '#ff4444';
      let errEl = label.nextElementSibling;
      if (!errEl || !errEl.classList.contains('field-error')) {
        errEl = document.createElement('span');
        errEl.className = 'field-error';
        label.after(errEl);
      }
      errEl.textContent = 'Необходимо согласие на обработку данных';
    }
    return;
  }
  const agreeErr = form.querySelector('.field-error');
  if (agreeErr) agreeErr.textContent = '';
  const data = Object.fromEntries(new FormData(form));
  const btn = form.querySelector('button[type="submit"]');
  const origText = btn.textContent;
  btn.textContent = 'Отправляем...';
  btn.disabled = true;
  try {
    const res = await fetch('/api/send-lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (res.ok) {
      btn.textContent = 'Заявка отправлена ✓';
      form.reset();
      if (onSuccess) onSuccess();
    } else { throw new Error(); }
  } catch {
    btn.textContent = 'Ошибка. Позвоните нам';
    btn.disabled = false;
  }
}

document.querySelectorAll('.cta-form__form').forEach(form => {
  const phoneInput = form.querySelector('input[type="tel"]');
  if (phoneInput) phoneInput.addEventListener('input', () => validatePhone(phoneInput));
  form.addEventListener('submit', e => { e.preventDefault(); submitForm(form); });
});

// ===== FAQ ACCORDION =====
document.querySelectorAll('.faq-item__btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const expanded = btn.getAttribute('aria-expanded') === 'true';
    const answer = btn.nextElementSibling;
    if (expanded) {
      btn.setAttribute('aria-expanded', 'false');
      answer.style.maxHeight = '0';
    } else {
      btn.setAttribute('aria-expanded', 'true');
      answer.style.maxHeight = answer.scrollHeight + 'px';
    }
  });
});

// ===== MODAL =====
const modal = document.getElementById('modal');
if (modal) {
  const openBtn = document.getElementById('openModal');
  const closeBtn = document.getElementById('closeModal');
  const overlay = document.getElementById('modalOverlay');

  const openModal = () => {
    modal.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  };
  const closeModal = () => {
    modal.classList.remove('is-open');
    document.body.style.overflow = '';
  };

  if (openBtn) openBtn.addEventListener('click', openModal);
  document.querySelectorAll('.js-open-modal').forEach(el => el.addEventListener('click', openModal));
  closeBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', closeModal);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

  const modalForm = document.getElementById('modalForm');
  if (modalForm) {
    const modalPhone = modalForm.querySelector('input[type="tel"]');
    if (modalPhone) modalPhone.addEventListener('input', () => validatePhone(modalPhone));
    modalForm.addEventListener('submit', e => {
      e.preventDefault();
      submitForm(modalForm, () => setTimeout(closeModal, 2000));
    });
  }
}

// ===== BURGER MENU =====
const burger = document.getElementById('burger');
const mobileNav = document.getElementById('mobileNav');
const mobileNavClose = document.getElementById('mobileNavClose');
const mobileNavOverlay = document.getElementById('mobileNavOverlay');

const openMobileNav = () => {
  if (!mobileNav) return;
  mobileNav.classList.add('is-open');
  burger.classList.add('burger--open');
  document.body.style.overflow = 'hidden';
};
const closeMobileNav = () => {
  if (!mobileNav) return;
  mobileNav.classList.remove('is-open');
  if (burger) burger.classList.remove('burger--open');
  document.body.style.overflow = '';
};

if (burger) burger.addEventListener('click', openMobileNav);
if (mobileNavClose) mobileNavClose.addEventListener('click', closeMobileNav);
if (mobileNavOverlay) mobileNavOverlay.addEventListener('click', closeMobileNav);
document.querySelectorAll('.mobile-nav__link').forEach(l => l.addEventListener('click', closeMobileNav));
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMobileNav(); });

// ===== VIDEO RESUME ON PAGE VISIBILITY =====
const heroVideo = document.querySelector('.hero__video-bg');
if (heroVideo) {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      setTimeout(() => { heroVideo.play().catch(() => {}); }, 300);
    }
  });
}


