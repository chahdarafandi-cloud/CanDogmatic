// Système d'internationalisation
class I18n {
    constructor() {
        this.currentLang = 'ca';
        this.translations = {};
        this.init();
    }

    async init() {
        const savedLang = localStorage.getItem('preferredLang');
        const browserLang = navigator.language?.split('-')[0];
        
        if (savedLang && ['ca', 'es', 'fr', 'en'].includes(savedLang)) {
            this.currentLang = savedLang;
        } else if (browserLang && ['ca', 'es', 'fr', 'en'].includes(browserLang)) {
            this.currentLang = browserLang;
        }
        
        await this.loadTranslations(this.currentLang);
        this.updatePage();
    }

    async loadTranslations(lang) {
        try {
            // Correction : chemin relatif sans barre oblique initiale
            const response = await fetch(`lang/${lang}.json`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.translations = await response.json();
        } catch (error) {
            console.error('Error loading translations:', error);
            // Fallback au catalan si la langue demandée échoue
            if (lang !== 'ca') {
                console.log('Fallback to catalan translations');
                try {
                    const fallbackResponse = await fetch('lang/ca.json');
                    if (fallbackResponse.ok) {
                        this.translations = await fallbackResponse.json();
                    }
                } catch (fallbackError) {
                    console.error('Fallback translation also failed:', fallbackError);
                }
            }
        }
    }

    t(key) {
        if (!key || typeof key !== 'string') return key;
        
        const keys = key.split('.');
        let value = this.translations;
        
        for (const k of keys) {
            if (value && typeof value === 'object') {
                value = value[k];
            } else {
                return key; // Retourne la clé si non trouvée
            }
        }
        
        return value !== undefined ? value : key;
    }

    updatePage() {
        // Mise à jour des textes
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = this.t(key);
            if (translation && translation !== key) {
                element.textContent = translation;
            }
        });

        // Mise à jour des placeholders
        document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
            const key = element.getAttribute('data-i18n-placeholder');
            const translation = this.t(key);
            if (translation && translation !== key) {
                element.placeholder = translation;
            }
        });

        // Mise à jour des titres
        document.querySelectorAll('[data-i18n-title]').forEach(element => {
            const key = element.getAttribute('data-i18n-title');
            const translation = this.t(key);
            if (translation && translation !== key) {
                element.title = translation;
            }
        });

        // Mettre à jour l'attribut lang du document
        document.documentElement.lang = this.currentLang;

        // Mettre à jour le sélecteur de langue
        const langToggle = document.getElementById('languageToggle');
        if (langToggle) {
            const langNames = {
                'ca': 'CA',
                'es': 'ES', 
                'fr': 'FR',
                'en': 'EN'
            };
            const currentLangSpan = langToggle.querySelector('.current-lang');
            if (currentLangSpan) {
                currentLangSpan.textContent = langNames[this.currentLang] || 'CA';
            }
        }

        // Mettre à jour le texte d'avertissement si présent
        this.updateWarningText();
        
        // Mettre à jour les balises méta alternates
        this.updateMetaTags();
    }

    updateWarningText() {
        const warningElement = document.querySelector('.warning-text');
        if (warningElement) {
            const translation = this.t('warning.message');
            if (translation && translation !== 'warning.message') {
                warningElement.textContent = translation;
            }
        }
    }

    async changeLanguage(lang) {
        if (!['ca', 'es', 'fr', 'en'].includes(lang)) {
            console.error('Langue non supportée:', lang);
            return;
        }
        
        if (this.currentLang !== lang) {
            this.currentLang = lang;
            localStorage.setItem('preferredLang', lang);
            await this.loadTranslations(lang);
            this.updatePage();
            
            // Déclencher un événement personnalisé
            window.dispatchEvent(new CustomEvent('languageChanged', { 
                detail: { language: lang } 
            }));
            
            console.log(`Langue changée vers: ${lang}`);
        }
    }

    updateMetaTags() {
        const links = document.querySelectorAll('link[rel="alternate"]');
        links.forEach(link => {
            const href = link.getAttribute('href');
            if (href) {
                // Mettre à jour l'URL pour la langue actuelle
                const newHref = href.replace(/\/[a-z]{2}\//, `/${this.currentLang}/`);
                link.setAttribute('href', newHref);
            }
        });
    }
}

// Initialisation de l'objet i18n
const i18n = new I18n();

// Gestion du sélecteur de langue
document.addEventListener('DOMContentLoaded', function() {
    const languageToggle = document.getElementById('languageToggle');
    const languageDropdown = document.getElementById('languageDropdown');
    const langOptions = document.querySelectorAll('.lang-option');

    if (languageToggle && languageDropdown) {
        languageToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            languageDropdown.classList.toggle('show');
        });

        document.addEventListener('click', function(e) {
            if (!languageToggle.contains(e.target) && !languageDropdown.contains(e.target)) {
                languageDropdown.classList.remove('show');
            }
        });

        langOptions.forEach(option => {
            option.addEventListener('click', function(e) {
                e.preventDefault();
                const lang = this.getAttribute('data-lang');
                if (lang) {
                    i18n.changeLanguage(lang);
                    languageDropdown.classList.remove('show');
                    
                    // Effet visuel de feedback
                    this.style.backgroundColor = '#e0f2fe';
                    setTimeout(() => {
                        this.style.backgroundColor = '';
                    }, 500);
                }
            });
        });
    }
});

// Gestion des cookies
const cookieBanner = document.getElementById('cookieBanner');
const acceptCookies = document.getElementById('acceptCookies');
const rejectCookies = document.getElementById('rejectCookies');

// Vérifier si les éléments existent avant de les utiliser
if (cookieBanner && acceptCookies && rejectCookies) {
    setTimeout(() => {
        const cookiesAccepted = localStorage.getItem('cookiesAccepted');
        if (cookiesAccepted !== 'true' && cookiesAccepted !== 'false') {
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
}

function initializeCookies() {
    console.log('Cookies acceptés - Services activés');
    // Ici vous pouvez initialiser Google Analytics, Facebook Pixel, etc.
}

function disableCookies() {
    console.log('Cookies refusés - Services désactivés');
    // Ici vous pouvez désactiver les services de suivi
}

// Navigation mobile
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');

if (hamburger && navMenu) {
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
        document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';
    });

    // Fermer le menu en cliquant sur un lien
    document.querySelectorAll('.nav-link').forEach(n => {
        n.addEventListener('click', () => {
            if (hamburger) hamburger.classList.remove('active');
            if (navMenu) navMenu.classList.remove('active');
            document.body.style.overflow = '';
        });
    });
}

// Smooth scroll pour les liens d'ancrage
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href === '#') return;
        
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
            
            // Mettre à jour l'URL sans rechargement
            history.pushState(null, null, href);
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
    if (modal) {
        modal.style.display = modal.style.display === 'block' ? 'none' : 'block';
        
        // Empêcher le défilement du body quand la modal est ouverte
        if (modal.style.display === 'block') {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
    }
}

// Fermer la modal en cliquant en dehors
window.addEventListener('click', (e) => {
    const modal = document.getElementById('newsletterModal');
    if (modal && e.target === modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
});

// Gestion du formulaire de newsletter
const newsletterForm = document.querySelector('.newsletter-form');
if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const emailInput = newsletterForm.querySelector('input[type="email"]');
        const email = emailInput?.value;
        
        if (email && validateEmail(email)) {
            console.log('Inscription newsletter:', email);
            showNotification('Merci pour votre inscription à notre newsletter !', 'success');
            newsletterForm.reset();
            toggleNewsletter();
        } else {
            showNotification('Veuillez entrer une adresse email valide', 'error');
        }
    });
}

// Gestion du formulaire de contact
const contactForm = document.querySelector('.contact-form');
if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        if (validateContactForm(contactForm)) {
            const formData = new FormData(contactForm);
            const data = Object.fromEntries(formData);
            
            console.log('Formulaire contact:', data);
            showNotification('Message envoyé avec succès ! Nous vous recontacterons rapidement.', 'success');
            contactForm.reset();
        } else {
            showNotification('Veuillez remplir tous les champs obligatoires', 'error');
        }
    });
}

// Gestion du formulaire de donation
document.addEventListener('DOMContentLoaded', function() {
    const donationForm = document.getElementById('donationForm');
    const messageTextarea = document.getElementById('message');
    const charCount = document.getElementById('charCount');
    
    // Compteur de caractères pour le message
    if (messageTextarea && charCount) {
        messageTextarea.addEventListener('input', function() {
            const length = this.value.length;
            charCount.textContent = length;
            
            // Changer la couleur en fonction de la longueur
            if (length > 280) {
                charCount.style.color = '#e53e3e';
                this.style.borderColor = '#e53e3e';
            } else if (length > 200) {
                charCount.style.color = '#dd6b20';
                this.style.borderColor = '#dd6b20';
            } else {
                charCount.style.color = '#718096';
                this.style.borderColor = '#cbd5e0';
            }
        });
        
        // Initialiser le compteur
        charCount.textContent = messageTextarea.value.length;
    }
    
    // Soumission du formulaire de donation
    if (donationForm) {
        donationForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            if (!validateDonationForm(this)) {
                return;
            }
            
            const email = document.getElementById('email').value;
            const confirmEmail = document.getElementById('confirmEmail').value;
            
            // Vérifier que les emails correspondent
            if (email !== confirmEmail) {
                showNotification('Les adresses email ne correspondent pas', 'error');
                return;
            }
            
            const amountInput = document.getElementById('donationAmount');
            const amount = parseFloat(amountInput.value);
            
            if (isNaN(amount) || amount < 1) {
                showNotification('Veuillez entrer un montant valide (minimum 1€)', 'error');
                return;
            }
            
            // Récupérer les données du formulaire
            const formData = new FormData(donationForm);
            const data = {
                fullName: formData.get('fullName'),
                email: formData.get('email'),
                gender: formData.get('gender'),
                mailingList: formData.get('mailingList') === 'on',
                donationAmount: amount,
                paymentMethod: formData.get('paymentMethod'),
                message: formData.get('message'),
                consent: formData.get('consent') === 'on'
            };
            
            console.log('Donation data:', data);
            
            // Afficher une notification et rediriger vers le paiement
            showNotification('Merci pour votre don! Redirection vers le système de paiement...', 'success');
            
            // Simuler une redirection vers le système de paiement
            setTimeout(() => {
                if (data.paymentMethod === 'stripe') {
                    // En production, vous utiliseriez l'API Stripe
                    window.open('https://stripe.com/checkout', '_blank');
                } else if (data.paymentMethod === 'paypal') {
                    // En production, vous utiliseriez l'API PayPal
                    window.open('https://paypal.com/checkout', '_blank');
                }
                
                // Réinitialiser le formulaire après la redirection
                donationForm.reset();
                if (charCount) charCount.textContent = '0';
            }, 2000);
        });
    }
});

// Validation d'email
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Validation du formulaire de contact
function validateContactForm(form) {
    const requiredFields = form.querySelectorAll('[required]');
    for (let field of requiredFields) {
        if (!field.value.trim()) {
            field.focus();
            return false;
        }
    }
    return true;
}

// Validation du formulaire de donation
function validateDonationForm(form) {
    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;
    
    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            field.style.borderColor = '#e53e3e';
            isValid = false;
        } else {
            field.style.borderColor = '';
        }
    });
    
    // Vérifier le consentement
    const consentCheckbox = form.querySelector('input[name="consent"]');
    if (consentCheckbox && !consentCheckbox.checked) {
        showNotification('Vous devez accepter la politique de confidentialité', 'error');
        isValid = false;
    }
    
    return isValid;
}

// Fonction pour traiter un don (version simulée)
function processDonation(data) {
    console.log('Processing donation for:', data.fullName);
    // En production, ici vous enverriez les données à votre serveur
    // puis redirigeriez vers la passerelle de paiement
  
    // Simulation de traitement
    showNotification('Traitement de votre don...', 'success');
    
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({ success: true, transactionId: 'TXN_' + Date.now() });
        }, 1000);
    });
}

// Système de notification
function showNotification(message, type = 'success') {
    // Vérifier si une notification existe déjà
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
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
        transform: translateX(120%);
        transition: transform 0.3s ease;
        max-width: 300px;
        font-family: inherit;
    `;
    
    document.body.appendChild(notification);
    
    // Animation d'entrée
    requestAnimationFrame(() => {
        notification.style.transform = 'translateX(0)';
    });
    
    // Supprimer après 5 secondes
    setTimeout(() => {
        notification.style.transform = 'translateX(120%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 5000);
}

// Animation au scroll avec Intersection Observer
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
            observer.unobserve(entry.target); // Arrêter d'observer une fois animé
        }
    });
}, observerOptions);

document.addEventListener('DOMContentLoaded', () => {
    // Éléments à animer
    const animatedElements = document.querySelectorAll(
        '.team-member, .value-card, .contact-info, .info-card, .scholar-card'
    );
    
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
    
    // Initialiser les filtres des savants
    initScholarFilters();
});

// Compteur animé pour les statistiques
function animateCounter(element, target, duration = 2000) {
    const start = 0;
    const increment = target / (duration / 16);
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = target + '+';
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current);
        }
    }, 16);
}

// Observer pour déclencher les compteurs
const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const stats = entry.target.querySelectorAll('.stat-number');
            stats.forEach(stat => {
                const text = stat.textContent.replace('+', '');
                const target = parseInt(text);
                if (!isNaN(target)) {
                    animateCounter(stat, target);
                }
            });
            statsObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.5 });

// Observer la section about pour les statistiques
const aboutSection = document.querySelector('.about');
if (aboutSection) {
    statsObserver.observe(aboutSection);
}

// Observer les statistiques des savants
const scholarsStats = document.querySelector('.scholars-stats');
if (scholarsStats) {
    statsObserver.observe(scholarsStats);
}

// Changement de style de la navbar au scroll
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        if (window.scrollY > 50) {
            navbar.style.background = 'rgba(255, 255, 255, 0.98)';
            navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
            navbar.style.backdropFilter = 'blur(10px)';
        } else {
            navbar.style.background = 'rgba(255, 255, 255, 0.95)';
            navbar.style.boxShadow = 'none';
            navbar.style.backdropFilter = 'none';
        }
    }
});

// Gestion des filtres des savants
function initScholarFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const scholarCards = document.querySelectorAll('.scholar-card');
    
    if (filterBtns.length === 0 || scholarCards.length === 0) {
        return;
    }
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Retirer la classe active de tous les boutons
            filterBtns.forEach(b => b.classList.remove('active'));
            // Ajouter la classe active au bouton cliqué
            this.classList.add('active');
            
            const category = this.getAttribute('data-category');
            
            // Filtrer les savants avec animation
            scholarCards.forEach(card => {
                if (category === 'all') {
                    card.style.display = 'block';
                    setTimeout(() => {
                        card.style.opacity = '1';
                        card.style.transform = 'translateY(0)';
                    }, 50);
                } else {
                    const cardCategory = card.getAttribute('data-category');
                    if (cardCategory === category) {
                        card.style.display = 'block';
                        setTimeout(() => {
                            card.style.opacity = '1';
                            card.style.transform = 'translateY(0)';
                        }, 50);
                    } else {
                        card.style.opacity = '0';
                        card.style.transform = 'translateY(20px)';
                        setTimeout(() => {
                            card.style.display = 'none';
                        }, 300);
                    }
                }
            });
        });
    });
    
    // Pagination simple (exemple basique)
    const paginationBtns = document.querySelectorAll('.pagination-btn');
    paginationBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            paginationBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            // Ici vous pouvez ajouter la logique pour charger plus de savants
            showNotification(`Chargement de la page ${this.textContent}...`, 'info');
        });
    });
}

// Initialisation générale
document.addEventListener('DOMContentLoaded', function() {
    console.log('Site Can Dogmatic initialisé - www.CanDogmatic.com');
    
    // Vérifier et appliquer les préférences de cookies
    const cookiesAccepted = localStorage.getItem('cookiesAccepted');
    if (cookiesAccepted === 'true') {
        initializeCookies();
    }
    
    // Mettre à jour la date de copyright automatiquement
    const copyrightYear = document.querySelector('.footer-bottom p');
    if (copyrightYear) {
        const currentYear = new Date().getFullYear();
        copyrightYear.innerHTML = copyrightYear.innerHTML.replace('2024', currentYear);
    }
});
