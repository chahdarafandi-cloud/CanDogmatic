// Système de internationalisation
class I18n {
    constructor() {
        this.currentLang = 'ca';
        this.translations = {};
        this.init();
    }

    async init() {
        const savedLang = localStorage.getItem('preferredLang');
        const browserLang = navigator.language.split('-')[0];
        
        if (savedLang && ['ca', 'es', 'fr', 'en'].includes(savedLang)) {
            this.currentLang = savedLang;
        } else if (['ca', 'es', 'fr', 'en'].includes(browserLang)) {
            this.currentLang = browserLang;
        }
        
        await this.loadTranslations(this.currentLang);
        this.updatePage();
    }

    async loadTranslations(lang) {
        try {
            const response = await fetch(`/lang/${lang}.json`);
            this.translations = await response.json();
        } catch (error) {
            console.error('Error loading translations:', error);
            if (lang !== 'ca') {
                await this.loadTranslations('ca');
            }
        }
    }

    t(key) {
        const keys = key.split('.');
        let value = this.translations;
        
        for (const k of keys) {
            value = value[k];
            if (value === undefined) return key;
        }
        
        return value;
    }

    updatePage() {
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = this.t(key);
            if (translation) {
                element.textContent = translation;
            }
        });

        document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
            const key = element.getAttribute('data-i18n-placeholder');
            const translation = this.t(key);
            if (translation) {
                element.setAttribute('placeholder', translation);
            }
        });

        document.querySelectorAll('[data-i18n-title]').forEach(element => {
            const key = element.getAttribute('data-i18n-title');
            const translation = this.t(key);
            if (translation) {
                element.setAttribute('title', translation);
            }
        });

        document.documentElement.lang = this.currentLang;

        const langToggle = document.getElementById('languageToggle');
        if (langToggle) {
            const langNames = {
                'ca': 'CA',
                'es': 'ES', 
                'fr': 'FR',
                'en': 'EN'
            };
            langToggle.querySelector('.current-lang').textContent = langNames[this.currentLang];
        }

        this.updateWarningText();
    }

    updateWarningText() {
        const warningElement = document.querySelector('.warning-text');
        if (warningElement) {
            const translation = this.t('warning.message');
            if (translation) {
                warningElement.textContent = translation;
            }
        }
    }

    async changeLanguage(lang) {
        if (this.currentLang !== lang) {
            this.currentLang = lang;
            localStorage.setItem('preferredLang', lang);
            await this.loadTranslations(lang);
            this.updatePage();
            
            window.dispatchEvent(new CustomEvent('languageChanged', { 
                detail: { language: lang } 
            }));
        }
    }

    updateMetaTags() {
        const links = document.querySelectorAll('link[rel="alternate"]');
        links.forEach(link => {
            const href = link.getAttribute('href');
            if (href) {
                link.setAttribute('href', href.replace(/\/[a-z]{2}\//, `/${this.currentLang}/`));
            }
        });
    }
}

const i18n = new I18n();

// Gestion du sélecteur de langue
document.addEventListener('DOMContentLoaded', function() {
    const languageToggle = document.getElementById('languageToggle');
    const languageDropdown = document.getElementById('languageDropdown');
    const langOptions = document.querySelectorAll('.lang-option');

    if (languageToggle) {
        languageToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            languageDropdown.classList.toggle('show');
        });

        document.addEventListener('click', function() {
            languageDropdown.classList.remove('show');
        });

        langOptions.forEach(option => {
            option.addEventListener('click', function() {
                const lang = this.getAttribute('data-lang');
                i18n.changeLanguage(lang);
                languageDropdown.classList.remove('show');
                
                this.style.backgroundColor = '#e0f2fe';
                setTimeout(() => {
                    this.style.backgroundColor = '';
                }, 500);
            });
        });
    }
});

// Gestion des cookies
const cookieBanner = document.getElementById('cookieBanner');
const acceptCookies = document.getElementById('acceptCookies');
const rejectCookies = document.getElementById('rejectCookies');

setTimeout(() => {
    if (!localStorage.getItem('cookiesAccepted')) {
        cookieBanner.classList.add('show');
    }
}, 2000);

acceptCookies.addEventListener('click', () => {
    localStorage.setItem('cookiesAccepted', 'true');
    cookieBanner.classList.remove('show');
    initializeCookies();
});

rejectCookies.addEventListener('click', () => {
    localStorage.setItem('cookiesAccepted', 'false');
    cookieBanner.classList.remove('show');
    disableCookies();
});

function initializeCookies() {
    console.log('Cookies acceptés - Services activés');
}

function disableCookies() {
    console.log('Cookies refusés - Services désactivés');
}

// Navigation mobile
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');

if (hamburger) {
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
    });
}

document.querySelectorAll('.nav-link').forEach(n => n.addEventListener('click', () => {
    if (hamburger) hamburger.classList.remove('active');
    if (navMenu) navMenu.classList.remove('active');
}));

// Smooth scroll pour les liens d'ancrage
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

// Fonction pour scroller vers une section
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

// Gestion de la newsletter
function toggleNewsletter() {
    const modal = document.getElementById('newsletterModal');
    modal.style.display = modal.style.display === 'block' ? 'none' : 'block';
}

window.addEventListener('click', (e) => {
    const modal = document.getElementById('newsletterModal');
    if (e.target === modal) {
        modal.style.display = 'none';
    }
});

// Gestion du formulaire de newsletter
const newsletterForm = document.querySelector('.newsletter-form');
if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = newsletterForm.querySelector('input[type="email"]').value;
        
        console.log('Inscription newsletter:', email);
        showNotification('Merci pour votre inscription à notre newsletter !', 'success');
        newsletterForm.reset();
        toggleNewsletter();
    });
}

// Gestion du formulaire de contact
const contactForm = document.querySelector('.contact-form');
if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const formData = new FormData(contactForm);
        const data = Object.fromEntries(formData);
        
        console.log('Formulaire contact:', data);
        showNotification('Message envoyé avec succès ! Nous vous recontacterons rapidement.', 'success');
        contactForm.reset();
    });
}

// Gestion du formulaire de donation
document.addEventListener('DOMContentLoaded', function() {
    const donationForm = document.getElementById('donationForm');
    const messageTextarea = document.getElementById('message');
    const charCount = document.getElementById('charCount');
    
    if (messageTextarea && charCount) {
        messageTextarea.addEventListener('input', function() {
            const length = this.value.length;
            charCount.textContent = length;
            
            if (length > 280) {
                charCount.style.color = '#e53e3e';
            } else if (length > 200) {
                charCount.style.color = '#dd6b20';
            } else {
                charCount.style.color = 'var(--text-light)';
            }
        });
    }
    
    if (donationForm) {
        donationForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const confirmEmail = document.getElementById('confirmEmail').value;
            
            if (email !== confirmEmail) {
                showNotification('Les adresses email ne correspondent pas', 'error');
                return;
            }
            
            const amount = parseFloat(document.getElementById('donationAmount').value);
            if (isNaN(amount) || amount < 1) {
                showNotification('Veuillez entrer un montant valide', 'error');
                return;
            }
            
            const formData = new FormData(donationForm);
            const data = {
                fullName: formData.get('fullName'),
                email: formData.get('email'),
                gender: formData.get('gender'),
                mailingList: formData.get('mailingList') === 'on',
                donationAmount: amount,
                processingFee: formData.get('processingFee'),
                paymentMethod: formData.get('paymentMethod'),
                message: formData.get('message'),
                consent: formData.get('consent') === 'on'
            };
            
            console.log('Donation data:', data);
            processDonation(data);
        });
    }
});

function processDonation(data) {
    showNotification('Merci pour votre don! Redirection vers le système de paiement...', 'success');
    
    setTimeout(() => {
        if (data.paymentMethod === 'stripe') {
            window.location.href = 'https://stripe.com/checkout';
        } else if (data.paymentMethod === 'paypal') {
            window.location.href = 'https://paypal.com/checkout';
        }
    }, 2000);
}

// Système de notification
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${type === 'success' ? '#10b981' : '#ef4444'};
        color: white;
        border-radius: 8px;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        transform: translateX(100%);
        transition: transform 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 5000);
}

// Animation au scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

document.addEventListener('DOMContentLoaded', () => {
    const animatedElements = document.querySelectorAll('.team-member, .value-card, .contact-info, .info-card');
    
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
});

// Compteur animé pour les statistiques
function animateCounter(element, target, duration = 2000) {
    let start = 0;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
        start += increment;
        if (start >= target) {
            element.textContent = target + '+';
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(start);
        }
    }, 16);
}

const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const stats = document.querySelectorAll('.stat-number');
            stats.forEach(stat => {
                const target = parseInt(stat.textContent);
                animateCounter(stat, target);
            });
            statsObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.5 });

const aboutSection = document.querySelector('.about');
if (aboutSection) {
    statsObserver.observe(aboutSection);
}

// Changement de style de la navbar au scroll
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (navbar && window.scrollY > 100) {
        navbar.style.background = 'rgba(255, 255, 255, 0.98)';
        navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
    } else if (navbar) {
        navbar.style.background = 'rgba(255, 255, 255, 0.95)';
        navbar.style.boxShadow = 'none';
    }
});

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    console.log('Site Can Dogmatic initialisé - www.CanDogmatic.com');
    
    if (localStorage.getItem('cookiesAccepted') === 'true') {
        initializeCookies();
    }
});
