const header = document.querySelector('.site-header');
const toggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('#nav-links');
const leadForm = document.querySelector('#lead-form');
const statusEl = document.querySelector('#form-status');

const setHeader = () => header?.setAttribute('data-shadow', String(window.scrollY > 18));
setHeader();
window.addEventListener('scroll', setHeader, { passive: true });

toggle?.addEventListener('click', () => {
  const open = toggle.getAttribute('aria-expanded') === 'true';
  toggle.setAttribute('aria-expanded', String(!open));
  navLinks?.classList.toggle('is-open', !open);
});

navLinks?.addEventListener('click', (event) => {
  if (event.target.matches('a')) {
    toggle?.setAttribute('aria-expanded', 'false');
    navLinks.classList.remove('is-open');
  }
});

const revealNodes = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  revealNodes.forEach((node) => observer.observe(node));
} else {
  revealNodes.forEach((node) => node.classList.add('is-visible'));
}

leadForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = new FormData(leadForm);
  const empresa = String(data.get('empresa') || '').trim();
  const unidad = String(data.get('unidad') || '').trim();
  const mensaje = String(data.get('mensaje') || '').trim();
  if (!empresa || !unidad || !mensaje) {
    statusEl.textContent = 'Completá los tres campos para preparar la consulta.';
    return;
  }
  const subject = encodeURIComponent(`Consulta FleetScan — ${empresa}`);
  const body = encodeURIComponent(`Empresa: ${empresa}\nUnidad: ${unidad}\nSituación: ${mensaje}\n\nQuiero coordinar un diagnóstico vehicular.`);
  // ponytail: static landing ceiling; upgrade path is replacing mailto with WhatsApp/CRM endpoint when the real contact exists.
  window.location.href = `mailto:contacto@fleetscan-tecnica.com?subject=${subject}&body=${body}`;
  statusEl.textContent = 'Consulta preparada. Conectá el correo real del negocio para recibir leads.';
});
