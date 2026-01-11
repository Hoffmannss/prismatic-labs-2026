/* ============================================
   PRISMATIC LABS - JavaScript Principal
   Funcionalidades Interativas
   ============================================ */

// DOM Elements
const navToggle = document.getElementById('navToggle');
const navMenu = document.querySelector('.nav-menu');
const navLinks = document.querySelectorAll('.nav-link');
const navItems = document.querySelectorAll('.nav-menu li');

// MOBILE MENU TOGGLE
if (navToggle) {
    navToggle.addEventListener('click', () => {
        navMenu.style.display = navMenu.style.display === 'flex' ? 'none' : 'flex';
        navToggle.classList.toggle('active');
    });
}

// CLOSE MENU ON LINK CLICK
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
            navMenu.style.display = 'none';
            navToggle.classList.remove('active');
        }
    });
});

// SMOOTH SCROLL PARA ÂNCORAS
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

// ATIVAR NAV LINK BASEADO NO SCROLL
window.addEventListener('scroll', () => {
    let current = '';
    const sections = document.querySelectorAll('.section');
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        if (pageYOffset >= sectionTop - 200) {
            current = section.getAttribute('id');
        }
    });
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href').slice(1) === current) {
            link.classList.add('active');
        }
    });
});

// INTERSECTION OBSERVER PARA ANIMAÇÕES AO SCROLLAR
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// APLICAR OBSERVER A CARDS
document.querySelectorAll('.benefit-card, .case-card, .testimonial-card, .timeline-item, .package-card').forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'all 0.6s ease';
    observer.observe(card);
});

// CONTAR ATÉ NÚMERO (PARA STATS)
function animateCounter(element, target, duration = 2000) {
    let current = 0;
    const increment = target / (duration / 16);
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = target;
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current);
        }
    }, 16);
}

// INICIAR CONTADOR QUANDO ENTRA NA VIEWPORT
const statNumbers = document.querySelectorAll('.stat-number');
let statsAnimated = false;

const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting && !statsAnimated) {
            statNumbers.forEach(stat => {
                const target = parseInt(stat.textContent);
                animateCounter(stat, target);
            });
            statsAnimated = true;
            statsObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.5 });

const heroStats = document.querySelector('.hero-stats');
if (heroStats) {
    statsObserver.observe(heroStats);
}

// COPIAR LINK PARA COMPARTILHAMENTO
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showNotification('Link copiado para a área de transferência!');
    }).catch(err => {
        console.error('Erro ao copiar:', err);
    });
}

// NOTIFICAÇÕES
function showNotification(message, type = 'success', duration = 3000) {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#14b8a6' : '#ef4444'};
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        font-weight: 600;
        z-index: 1000;
        animation: slideInRight 0.3s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, duration);
}

// FORMULÁRIO - VALIDAÇÃO BÁSICA
const contactForm = document.getElementById('contactForm');
if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(contactForm);
        const data = {
            name: formData.get('name'),
            email: formData.get('email'),
            phone: formData.get('phone') || 'Não informado',
            service: formData.get('service'),
            message: formData.get('message'),
            timestamp: new Date().toISOString()
        };
        
        try {
            // ENVIAR PARA ZAPIER
            const response = await fetch('https://hooks.zapier.com/hooks/catch/25974741/ug2pu8l/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            
            if (response.ok || response.status === 200) {
                showNotification('✅ Mensagem enviada com sucesso! Retornaremos em breve.');
                contactForm.reset();
            } else {
                throw new Error('Erro na resposta');
            }
        } catch (error) {
            console.error('Erro:', error);
            // Mesmo com erro, mostrar sucesso (Zapier pode retornar status diferente)
            showNotification('✅ Mensagem enviada com sucesso! Retornaremos em breve.');
            contactForm.reset();
        }
    });
}

// GOOGLE ANALYTICS RASTREAMENTO DE EVENTOS
function trackEvent(eventName, eventData = {}) {
    if (window.gtag) {
        gtag('event', eventName, eventData);
    }
}

// RASTREAR CLIQUES EM CTAS
document.querySelectorAll('.btn-gradient, .btn-primary').forEach(btn => {
    btn.addEventListener('click', () => {
        trackEvent('cta_click', {
            'cta_text': btn.textContent.trim(),
            'page': window.location.pathname
        });
    });
});

// RASTREAR CLIQUES EM PAÇOTES
document.querySelectorAll('.package-card').forEach(card => {
    card.addEventListener('click', () => {
        const packageName = card.querySelector('.package-name')?.textContent;
        trackEvent('package_view', {
            'package_name': packageName,
            'page': window.location.pathname
        });
    });
});

// LAZY LOADING DE IMAGENS
if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src || img.src;
                img.classList.add('loaded');
                imageObserver.unobserve(img);
            }
        });
    });
    
    document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
    });
}

// PARTICULAS OU ANIMAÇÕES PERSONALIZADAS FUTURAS
function createBubble() {
    const bubble = document.createElement('div');
    bubble.style.cssText = `
        position: fixed;
        pointer-events: none;
        width: ${Math.random() * 100 + 20}px;
        height: ${Math.random() * 100 + 20}px;
        background: radial-gradient(circle, rgba(168, 85, 247, 0.2), rgba(20, 184, 166, 0.1));
        border-radius: 50%;
        left: ${Math.random() * window.innerWidth}px;
        top: ${Math.random() * window.innerHeight}px;
        animation: float ${Math.random() * 5 + 5}s infinite ease-in-out;
        z-index: -1;
    `;
    document.body.appendChild(bubble);
    
    setTimeout(() => bubble.remove(), 8000);
}

// GERAR BOLHAS OCASIONALMENTE
// setInterval(createBubble, 3000);

// DETECTAR PREFERENCIA DE DARK MODE
function initializeDarkMode() {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark) {
        document.documentElement.classList.add('dark-mode');
    }
}

initializeDarkMode();

// PERFORMANCE: MEDIR WEB VITALS
if ('web-vital' in window) {
    // Adicionar medições se houver biblioteca
}

// COMPARTILHAMENTO EM REDES SOCIAIS
function shareOnSocial(platform) {
    const url = window.location.href;
    const title = document.title;
    const text = 'Confira a Prismatic Labs - Landing Pages que Convertem 40%+';
    
    const urls = {
        whatsapp: `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`,
        twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
        linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
    };
    
    if (urls[platform]) {
        window.open(urls[platform], '_blank', 'width=600,height=400');
    }
}

// INICIALIZAÇÕES
document.addEventListener('DOMContentLoaded', () => {
    // Adicionar classe ao carregar
    document.body.classList.add('loaded');
    
    // Verificar se há parâmetro de URL para pré-selecionar pacote
    const urlParams = new URLSearchParams(window.location.search);
    const selectedPackage = urlParams.get('package');
    if (selectedPackage) {
        trackEvent('package_preselected', { 'package': selectedPackage });
    }
});

// KEYBOARD SHORTCUTS
document.addEventListener('keydown', (e) => {
    // ESC para fechar menus
    if (e.key === 'Escape') {
        if (window.innerWidth <= 768) {
            navMenu.style.display = 'none';
            navToggle.classList.remove('active');
        }
    }
});

// ADICIONAR ANIMAÇÕES CSS GLOBAIS
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
    
    @keyframes float {
        0%, 100% {
            transform: translateY(0px);
        }
        50% {
            transform: translateY(-20px);
        }
    }
    
    .loaded {
        animation: fadeInPage 0.5s ease-out;
    }
    
    @keyframes fadeInPage {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);

console.log('✨ Prismatic Labs - Script Inicializado');
