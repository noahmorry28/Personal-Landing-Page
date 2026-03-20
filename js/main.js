/**
 * Portfolio — main.js
 *
 * Modules:
 *  1. Cursor        — Custom cursor dot + outline, hover state
 *  2. Navigation    — Hamburger menu, hide-on-scroll, active link on scroll
 *  3. Hero          — Staggered text-reveal animation on page load
 *  4. Scroll Reveal — IntersectionObserver for .fade-up elements
 *  5. Form          — Contact form validation + submission feedback
 */

'use strict';

/* ═══════════════════════════════════════════════════════════════════════════
   1. CURSOR
   ─────────────────────────────────────────────────────────────────────────
   Moves a dot and a lagging outline circle to follow the mouse.
   Adds .cursor--hover to <body> when hovering interactive elements.
   ═══════════════════════════════════════════════════════════════════════════ */

const Cursor = (() => {
  // Skip on touch devices
  if (window.matchMedia('(hover: none)').matches) return;

  const dot     = document.querySelector('.cursor__dot');
  const outline = document.querySelector('.cursor__outline');

  if (!dot || !outline) return;

  // Move both dot and outline instantly on every mouse event
  const onMouseMove = (e) => {
    const x = e.clientX;
    const y = e.clientY;
    const pos = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
    dot.style.transform     = pos;
    outline.style.transform = pos;
  };

  // Hover state: enlarge outline over interactive elements
  const hoverTargets = 'a, button, [role="button"], input, textarea, label, .project-card, .skill-tag';

  const addHover    = () => document.body.classList.add('cursor--hover');
  const removeHover = () => document.body.classList.remove('cursor--hover');

  document.addEventListener('mousemove', onMouseMove, { passive: true });
  // (no rAF loop needed — both elements track the mouse directly)
  document.addEventListener('mouseleave', () => {
    dot.style.opacity     = '0';
    outline.style.opacity = '0';
  });
  document.addEventListener('mouseenter', () => {
    dot.style.opacity     = '';
    outline.style.opacity = '';
  });

  // Delegate hover events for dynamic content
  document.addEventListener('mouseover', (e) => {
    if (e.target.closest(hoverTargets)) addHover();
  });
  document.addEventListener('mouseout', (e) => {
    if (e.target.closest(hoverTargets)) removeHover();
  });

})();


/* ═══════════════════════════════════════════════════════════════════════════
   2. NAVIGATION
   ─────────────────────────────────────────────────────────────────────────
   • Adds .scrolled to header after scrolling past threshold
   • Hides header on scroll-down, reveals on scroll-up
   • Hamburger menu toggle on mobile
   • Active nav link highlighting via IntersectionObserver on sections
   ═══════════════════════════════════════════════════════════════════════════ */

const Navigation = (() => {
  const header    = document.getElementById('header');
  const hamburger = document.getElementById('hamburger');
  const navMenu   = document.getElementById('nav-menu');
  const navLinks  = document.querySelectorAll('[data-nav-link]');

  if (!header) return;

  // ── Scroll: show border + hide/reveal header ──
  let lastScroll = 0;
  const THRESHOLD = 20; // px before triggering scroll styles

  const onScroll = () => {
    const current = window.scrollY;

    // Add/remove scrolled state (border, darker bg)
    header.classList.toggle('scrolled', current > THRESHOLD);

    // Hide on scroll down, show on scroll up
    if (current > lastScroll && current > 120) {
      header.classList.add('hidden');
    } else {
      header.classList.remove('hidden');
    }

    lastScroll = Math.max(0, current);
  };

  window.addEventListener('scroll', onScroll, { passive: true });

  // ── Hamburger menu ──
  if (hamburger && navMenu) {
    hamburger.addEventListener('click', () => {
      const isOpen = hamburger.getAttribute('aria-expanded') === 'true';
      hamburger.setAttribute('aria-expanded', String(!isOpen));
      navMenu.classList.toggle('open', !isOpen);
      // Prevent body scroll when menu is open on mobile
      document.body.style.overflow = !isOpen ? 'hidden' : '';
    });

    // Close menu when a link is clicked
    navMenu.addEventListener('click', (e) => {
      if (e.target.matches('[data-nav-link]')) {
        hamburger.setAttribute('aria-expanded', 'false');
        navMenu.classList.remove('open');
        document.body.style.overflow = '';
      }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && navMenu.classList.contains('open')) {
        hamburger.setAttribute('aria-expanded', 'false');
        navMenu.classList.remove('open');
        document.body.style.overflow = '';
        hamburger.focus();
      }
    });
  }

  // ── Active nav link via IntersectionObserver on sections ──
  const sections = document.querySelectorAll('section[id]');

  if (sections.length && navLinks.length) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            navLinks.forEach((link) => {
              const isActive = link.getAttribute('href') === `#${entry.target.id}`;
              link.classList.toggle('active', isActive);
            });
          }
        });
      },
      {
        rootMargin: '-40% 0px -55% 0px', // trigger when section is in the middle band
        threshold: 0,
      }
    );

    sections.forEach((s) => observer.observe(s));
  }
})();


/* ═══════════════════════════════════════════════════════════════════════════
   3. HERO ANIMATION
   ─────────────────────────────────────────────────────────────────────────
   Adds .hero-ready to the hero section on window load, which triggers
   the CSS clip-slide-up transition on each .hero__line-inner element.
   Each line has a different transition-delay defined in CSS.
   ═══════════════════════════════════════════════════════════════════════════ */

const HeroAnimation = (() => {
  const hero = document.querySelector('.hero');
  if (!hero) return;

  // Fire on 'load' so fonts and resources are ready
  window.addEventListener('load', () => {
    // Small rAF buffer ensures the browser has painted the initial state
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        hero.classList.add('hero-ready');
      });
    });
  });
})();


/* ═══════════════════════════════════════════════════════════════════════════
   4. SCROLL REVEAL
   ─────────────────────────────────────────────────────────────────────────
   Observes all .fade-up elements.  When an element enters the viewport,
   .is-visible is added, triggering the CSS opacity + translateY transition.
   Staggered delays are applied to sibling groups for a cascade effect.
   ═══════════════════════════════════════════════════════════════════════════ */

const ScrollReveal = (() => {
  const elements = document.querySelectorAll('.fade-up');
  if (!elements.length) return;

  // Apply staggered delay to children inside grid/list containers
  const STAGGER_PARENTS = [
    '.skills__grid',
    '.projects__grid',
    '.testimonials__grid',
    '.about__facts',
    '.timeline',
  ];

  STAGGER_PARENTS.forEach((selector) => {
    const parent = document.querySelector(selector);
    if (!parent) return;
    const children = parent.querySelectorAll('.fade-up');
    children.forEach((el, i) => {
      el.style.transitionDelay = `${i * 0.08}s`;
    });
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          // Stop observing once revealed — no need to watch it further
          observer.unobserve(entry.target);
        }
      });
    },
    {
      rootMargin: '0px 0px -80px 0px', // trigger slightly before fully visible
      threshold: 0.05,
    }
  );

  elements.forEach((el) => observer.observe(el));
})();


/* ═══════════════════════════════════════════════════════════════════════════
   5. CONTACT FORM
   ─────────────────────────────────────────────────────────────────────────
   Client-side validation with accessible error feedback.
   Shows a success / error message after submission.
   Replace the simulated submit with your actual fetch() / FormData call.
   ═══════════════════════════════════════════════════════════════════════════ */

const ContactForm = (() => {
  const form       = document.getElementById('contact-form');
  const statusEl   = document.getElementById('form-status');
  const submitBtn  = form?.querySelector('[type="submit"]');

  if (!form || !statusEl) return;

  // ── Validate a single field ──
  const validateField = (field) => {
    const val = field.value.trim();

    if (field.required && !val) {
      field.classList.add('error');
      return false;
    }

    if (field.type === 'email' && val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
      field.classList.add('error');
      return false;
    }

    field.classList.remove('error');
    return true;
  };

  // Clear error state on input
  form.querySelectorAll('.form__input, .form__textarea').forEach((field) => {
    field.addEventListener('input', () => field.classList.remove('error'));
  });

  // ── Handle submit ──
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Validate all fields
    const fields   = [...form.querySelectorAll('.form__input, .form__textarea')];
    const allValid = fields.every(validateField);

    if (!allValid) {
      setStatus('Please fill in all required fields correctly.', 'error');
      // Focus the first invalid field
      form.querySelector('.error')?.focus();
      return;
    }

    // Disable button while submitting
    submitBtn.disabled = true;
    submitBtn.querySelector('span')?.textContent && (submitBtn.querySelector('span').textContent = 'Sending…');

    try {
      /*
       * ── EDIT: Replace this with your real form submission ──────────────
       * Example with Formspree:
       *
       *   const data = new FormData(form);
       *   const res  = await fetch('https://formspree.io/f/YOUR_ID', {
       *     method: 'POST',
       *     body: data,
       *     headers: { 'Accept': 'application/json' },
       *   });
       *   if (!res.ok) throw new Error('Network error');
       *
       * ───────────────────────────────────────────────────────────────────
       */

      // Simulated delay for demo purposes — remove in production
      await new Promise((resolve) => setTimeout(resolve, 1200));

      // Success
      form.reset();
      setStatus("Message sent! I'll get back to you soon.", 'success');
    } catch (err) {
      setStatus('Something went wrong. Please try again or email me directly.', 'error');
      console.error('[ContactForm] Submission error:', err);
    } finally {
      submitBtn.disabled = false;
      if (submitBtn.querySelector('span')) {
        submitBtn.querySelector('span').textContent = 'Send Message';
      }
    }
  });

  // ── Utility: set status message ──
  const setStatus = (message, type) => {
    statusEl.textContent = message;
    statusEl.className   = `form__status ${type}`;

    // Auto-clear after 6 seconds
    clearTimeout(statusEl._timer);
    statusEl._timer = setTimeout(() => {
      statusEl.textContent = '';
      statusEl.className   = 'form__status';
    }, 6000);
  };
})();


/* ═══════════════════════════════════════════════════════════════════════════
   INIT — log confirmation
   ═══════════════════════════════════════════════════════════════════════════ */

console.log(
  '%c Portfolio loaded. ',
  'background:#D4A843;color:#000;font-family:monospace;font-weight:bold;padding:4px 8px;border-radius:2px;'
);
