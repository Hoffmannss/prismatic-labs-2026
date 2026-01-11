// ===================================
// LANDING PAGE CAPTACAO.HTML - JS
// ===================================

(function() {
    'use strict';

    // ===================================
    // SCROLL SUAVE (Smooth Scroll)
    // ===================================
    const initSmoothScroll = () => {
        const links = document.querySelectorAll('a[href^="#"]');
        
        links.forEach(link => {
            link.addEventListener('click', function(e) {
                const href = this.getAttribute('href');
                
                // Ignora links vazios ou apenas #
                if (!href || href === '#') return;
                
                const target = document.querySelector(href);
                if (!target) return;
                
                e.preventDefault();
                
                const headerOffset = 80;
                const elementPosition = target.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                
                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
                
                // Tracking: Clique em CTA
                trackEvent('cta_click', {
                    cta_location: this.closest('section')?.className || 'unknown',
                    cta_text: this.textContent.trim()
                });
            });
        });
    };

    // ===================================
    // TRACKING DE EVENTOS (Analytics)
    // ===================================
    const trackEvent = (eventName, eventData = {}) => {
        // Google Analytics 4 (se disponível)
        if (typeof gtag !== 'undefined') {
            gtag('event', eventName, eventData);
        }
        
        // Console log para debug
        console.log('Event tracked:', eventName, eventData);
        
        // Pode adicionar outros trackers aqui (Meta Pixel, etc.)
    };

    // ===================================
    // TRACKING DE SCROLL DEPTH
    // ===================================
    const initScrollTracking = () => {
        const milestones = [25, 50, 75, 100];
        const tracked = new Set();
        
        const checkScrollDepth = () => {
            const windowHeight = window.innerHeight;
            const documentHeight = document.documentElement.scrollHeight;
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const scrollPercent = Math.round((scrollTop / (documentHeight - windowHeight)) * 100);
            
            milestones.forEach(milestone => {
                if (scrollPercent >= milestone && !tracked.has(milestone)) {
                    tracked.add(milestone);
                    trackEvent('scroll_depth', {
                        depth_percentage: milestone
                    });
                }
            });
        };
        
        let ticking = false;
        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    checkScrollDepth();
                    ticking = false;
                });
                ticking = true;
            }
        });
    };

    // ===================================
    // TRACKING DE TEMPO NA PÁGINA
    // ===================================
    const initTimeTracking = () => {
        const startTime = Date.now();
        const milestones = [30, 60, 120, 300]; // segundos
        const tracked = new Set();
        
        setInterval(() => {
            const timeOnPage = Math.floor((Date.now() - startTime) / 1000);
            
            milestones.forEach(milestone => {
                if (timeOnPage >= milestone && !tracked.has(milestone)) {
                    tracked.add(milestone);
                    trackEvent('time_on_page', {
                        seconds: milestone
                    });
                }
            });
        }, 10000); // Verifica a cada 10 segundos
    };

    // ===================================
    // CONTADOR DE URGÊNCIA (Opcional)
    // ===================================
    const initUrgencyCounter = () => {
        // Simula vagas restantes (você pode conectar com backend real)
        const updateVagasRestantes = () => {
            const vagasElements = document.querySelectorAll('.vagas-restantes');
            // Lógica para atualizar número de vagas
            // Por enquanto, mantemos fixo em 2
        };
        
        updateVagasRestantes();
    };

    // ===================================
    // TALLY FORM - EVENT LISTENERS
    // ===================================
    const initTallyFormTracking = () => {
        // Listener para quando formulário for enviado
        window.addEventListener('message', (event) => {
            // Verifica se é evento do Tally
            if (event.data.type === 'Tally.FormSubmitted') {
                trackEvent('form_submitted', {
                    form_id: 'wAjRvb',
                    form_name: 'orcamento_gratuito'
                });
                
                // Redireciona para página de agradecimento (opcional)
                // window.location.href = '/obrigado.html';
            }
            
            // Tracking de visão do formulário
            if (event.data.type === 'Tally.FormViewed') {
                trackEvent('form_viewed', {
                    form_id: 'wAjRvb'
                });
            }
        });
    };

    // ===================================
    // INTERSECTION OBSERVER (Animações ao Scroll)
    // ===================================
    const initScrollAnimations = () => {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -100px 0px'
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);
        
        // Observa elementos que devem animar
        const animatedElements = document.querySelectorAll(
            '.solution-card, .testimonial-card-lp, .faq-item, .problem-item'
        );
        
        animatedElements.forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(el);
        });
    };

    // ===================================
    // WHATSAPP TRACKING
    // ===================================
    const initWhatsAppTracking = () => {
        const whatsappLinks = document.querySelectorAll('a[href*="wa.me"]');
        
        whatsappLinks.forEach(link => {
            link.addEventListener('click', () => {
                trackEvent('whatsapp_click', {
                    link_location: link.closest('section')?.className || 'header'
                });
            });
        });
    };

    // ===================================
    // PERFORMANCE: LAZY LOADING IFRAME
    // ===================================
    const initLazyLoadIframe = () => {
        const iframe = document.querySelector('iframe[data-tally-src]');
        if (!iframe) return;
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // Iframe já é carregado pelo script do Tally
                    trackEvent('form_section_viewed');
                    observer.unobserve(entry.target);
                }
            });
        });
        
        observer.observe(iframe.parentElement);
    };

    // ===================================
    // COPY TO CLIPBOARD (se necessário)
    // ===================================
    const initCopyToClipboard = () => {
        const copyButtons = document.querySelectorAll('[data-copy]');
        
        copyButtons.forEach(button => {
            button.addEventListener('click', () => {
                const text = button.getAttribute('data-copy');
                navigator.clipboard.writeText(text).then(() => {
                    // Feedback visual
                    const originalText = button.textContent;
                    button.textContent = '✅ Copiado!';
                    
                    setTimeout(() => {
                        button.textContent = originalText;
                    }, 2000);
                    
                    trackEvent('text_copied', { text });
                });
            });
        });
    };

    // ===================================
    // HEADER SCROLL EFFECT
    // ===================================
    const initHeaderScroll = () => {
        const header = document.querySelector('.lp-header');
        if (!header) return;
        
        let lastScroll = 0;
        
        window.addEventListener('scroll', () => {
            const currentScroll = window.pageYOffset;
            
            // Adiciona sombra ao scrollar
            if (currentScroll > 50) {
                header.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.3)';
            } else {
                header.style.boxShadow = 'none';
            }
            
            lastScroll = currentScroll;
        });
    };

    // ===================================
    // EXIT INTENT (Popup de Saída)
    // ===================================
    const initExitIntent = () => {
        let exitIntentShown = false;
        
        document.addEventListener('mouseleave', (e) => {
            // Detecta quando mouse sai do viewport (topo)
            if (e.clientY < 10 && !exitIntentShown) {
                exitIntentShown = true;
                
                // Scroll para formulário
                const formulario = document.querySelector('#formulario');
                if (formulario) {
                    formulario.scrollIntoView({ behavior: 'smooth' });
                }
                
                trackEvent('exit_intent_triggered');
            }
        });
    };

    // ===================================
    // INICIALIZAÇÃO
    // ===================================
    const init = () => {
        // Aguarda DOM estar pronto
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                runInit();
            });
        } else {
            runInit();
        }
    };
    
    const runInit = () => {
        console.log('🚀 Prismatic Labs - Landing Page Loaded');
        
        // Inicializa todos os módulos
        initSmoothScroll();
        initScrollTracking();
        initTimeTracking();
        initUrgencyCounter();
        initTallyFormTracking();
        initScrollAnimations();
        initWhatsAppTracking();
        initLazyLoadIframe();
        initCopyToClipboard();
        initHeaderScroll();
        initExitIntent();
        
        // Track pageview
        trackEvent('page_view', {
            page_title: document.title,
            page_location: window.location.href
        });
    };
    
    // Inicia a aplicação
    init();

})();

// ===================================
// FUNÇÕES GLOBAIS (se necessário)
// ===================================

// Função para abrir WhatsApp com mensagem customizada
function abrirWhatsApp(mensagem = 'Olá! Quero saber mais sobre criação de sites') {
    const numero = '5548984580234';
    const url = `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;
    window.open(url, '_blank');
}