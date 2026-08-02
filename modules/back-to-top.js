export function initScrollEffects() {
  const scrollTopBtn = document.getElementById('scrollTopBtn');

  // Show/hide scroll-to-top button
  const setVisibleState = () => {
    const shouldShow = window.scrollY > 500;

    if (scrollTopBtn) {
      scrollTopBtn.classList.toggle('visible', shouldShow);
    }
  };

  window.addEventListener('scroll', setVisibleState, { passive: true });
  setVisibleState();

  // Scroll-to-top button functionality
  if (scrollTopBtn) {
    scrollTopBtn.addEventListener('click', () => {
      // Already at the top
      if (window.scrollY < 10) return;

      // Prevent multiple clicks during smooth scroll
      scrollTopBtn.style.pointerEvents = 'none';

      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });

      const onScrollEnd = () => {
        if (window.scrollY < 10) {
          scrollTopBtn.style.pointerEvents = '';
          window.removeEventListener('scroll', onScrollEnd);
        }
      };

      window.addEventListener('scroll', onScrollEnd, {
        passive: true,
      });
    });
  }

  // Animate cards when they enter the viewport
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
          // Stop observing once animated
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.1,
    }
  );

  document
    .querySelectorAll('.topic-card, .problem-card, .interview-card, .dashboard-card')
    .forEach((el) => observer.observe(el));
}

// Legacy global export
window.initScrollEffects = initScrollEffects;
