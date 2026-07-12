// Initialize Lucide Icons
lucide.createIcons();

// Smooth reveal animation on scroll
const observerOptions = {
  root: null,
  threshold: 0.1,
  rootMargin: "0px"
};

const observer = new IntersectionObserver((entries, observer) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('reveal-active');
      observer.unobserve(entry.target);
    }
  });
}, observerOptions);

// Select sections and cards to observe (skip elements inside .no-reveal containers,
// e.g. JS-toggled step screens that start hidden with display:none)
const revealElements = Array.from(document.querySelectorAll('section, .glass-card, .timeline-item'))
  .filter(el => !el.closest('.no-reveal'));
revealElements.forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(30px)';
  el.style.transition = 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)';
  observer.observe(el);
});

// Custom CSS class for revealed state (programmatically added behavior)
const revealStyle = document.createElement('style');
revealStyle.innerHTML = `
  .reveal-active {
    opacity: 1 !important;
    transform: translateY(0) !important;
  }
`;
document.head.appendChild(revealStyle);

// Smooth scroll for navigation
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const targetId = this.getAttribute('href');
    if (targetId === '#') return;
    const targetElement = document.querySelector(targetId);
    if (targetElement) {
      window.scrollTo({
        top: targetElement.offsetTop - 80,
        behavior: 'smooth'
      });
    }
  });
});

// Navbar background shift on scroll
window.addEventListener('scroll', () => {
  const header = document.querySelector('header');
  if (window.scrollY > 50) {
    header.style.padding = '0.8rem 0';
    header.style.boxShadow = '0 10px 40px rgba(0,0,0,0.5)';
  } else {
    header.style.padding = '1.5rem 0';
    header.style.boxShadow = 'none';
  }
});
