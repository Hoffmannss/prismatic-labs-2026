// ═══════════════════════════════════════════════════════════════════
// PRISMATIC LABS - PORTFOLIO JAVASCRIPT
// Interações e Funcionalidades
// ═══════════════════════════════════════════════════════════════════

// SMOOTH SCROLL
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// HEADER SCROLL EFFECT
let lastScroll = 0;
const header = document.querySelector('.header');

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > 80) {
        header.style.boxShadow = '0 10px 30px rgba(168, 85, 247, 0.2)';
    } else {
        header.style.boxShadow = 'none';
    }
    
    lastScroll = currentScroll;
});

// CONTACT FORM HANDLER
const contactForm = document.getElementById('contactForm');

if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(contactForm);
        const data = Object.fromEntries(formData);
        
        // Simulação de envio (integrar com backend/API)
        console.log('Formulário enviado:', data);
        
        // Feedback visual
        const submitButton = contactForm.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        
        submitButton.textContent = 'Enviando...';
        submitButton.style.opacity = '0.6';
        submitButton.disabled = true;
        
        // Simular delay de envio
        setTimeout(() => {
            submitButton.textContent = '✓ Mensagem Enviada!';
            submitButton.style.background = 'linear-gradient(135deg, #06D9D7, #A855F7)';
            
            setTimeout(() => {
                contactForm.reset();
                submitButton.textContent = originalText;
                submitButton.style.opacity = '1';
                submitButton.style.background = '';
                submitButton.disabled = false;
            }, 3000);
        }, 1500);
        
        // INTEGRAÇÃO SUGERIDA:
        // - EmailJS para envio de e-mails
        // - Google Sheets API para registro de leads
        // - Webhook para Zapier/Make
        // - CRM API (Pipedrive, HubSpot)
    });
}

// PORTFOLIO CARD HOVER EFFECTS
const portfolioCards = document.querySelectorAll('.portfolio-card');

portfolioCards.forEach(card => {
    card.addEventListener('mouseenter', () => {
        card.style.borderColor = 'var(--neon-teal)';
    });
    
    card.addEventListener('mouseleave', () => {
        card.style.borderColor = 'rgba(168, 85, 247, 0.2)';
    });
});

// SCROLL REVEAL ANIMATION
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Aplicar animação em seções
const sections = document.querySelectorAll('.portfolio-card, .timeline-step, .pricing-card');
sections.forEach(section => {
    section.style.opacity = '0';
    section.style.transform = 'translateY(30px)';
    section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(section);
});

// GRADIENT CURSOR EFFECT (opcional - efeito premium)
const hero = document.querySelector('.hero');
const heroGradient = document.querySelector('.hero-gradient');

if (hero && heroGradient) {
    hero.addEventListener('mousemove', (e) => {
        const x = e.clientX;
        const y = e.clientY;
        
        heroGradient.style.left = `${x}px`;
        heroGradient.style.top = `${y}px`;
    });
}

// PRICING CARD SELECTION
const pricingCards = document.querySelectorAll('.pricing-card');

pricingCards.forEach(card => {
    card.addEventListener('click', () => {
        pricingCards.forEach(c => c.style.outline = 'none');
        card.style.outline = '2px solid var(--neon-purple)';
    });
});

// LOG DE INICIALIZAÇÃO
console.log('%c PRISMATIC LABS Portfolio Loaded ', 'background: linear-gradient(135deg, #A855F7, #FF006E); color: white; font-size: 14px; padding: 10px;');
console.log('%c Dark Mode + Neon Colors Design System Active ', 'background: #06D9D7; color: black; font-size: 12px; padding: 5px;');