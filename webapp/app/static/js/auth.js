// auth.js - Gestion de l'authentification (version simple et fluide)

class AuthFormManager {
    constructor() {
        this.init();
    }
    
    init() {
        this.setupPasswordToggle();
        this.setupPasswordStrength();
        this.setupFormValidation();
        this.setupLiveButtonActivation(); // Nouvelle fonction pour activer le bouton
    }
    
    setupPasswordToggle() {
        document.querySelectorAll('.toggle-password').forEach(button => {
            button.addEventListener('click', (e) => {
                const targetId = e.target.closest('.toggle-password').getAttribute('data-target') || 'password';
                const input = document.getElementById(targetId);
                
                if (input) {
                    const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
                    input.setAttribute('type', type);
                    
                    const icon = e.target.closest('.toggle-password').querySelector('i');
                    icon.classList.toggle('fa-eye');
                    icon.classList.toggle('fa-eye-slash');
                }
            });
        });
    }
    
    setupPasswordStrength() {
        const passwordInput = document.getElementById('password');
        if (!passwordInput) return;
        
        passwordInput.addEventListener('input', () => {
            const password = passwordInput.value;
            const strength = this.calculatePasswordStrength(password);
            this.updateStrengthDisplay(strength);
        });
    }
    
    calculatePasswordStrength(password) {
        let strength = 0;
        if (password.length >= 8) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[a-z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[^A-Za-z0-9]/.test(password)) strength++;
        return Math.min(strength, 5);
    }
    
    updateStrengthDisplay(strength) {
        const bar = document.querySelector('.strength-bar');
        const text = document.getElementById('strengthValue');
        if (!bar || !text) return;
        const width = strength * 20;
        bar.style.setProperty('--strength-width', `${width}%`);
        bar.style.backgroundColor = this.getStrengthColor(strength);
        const strengths = ['Très faible', 'Faible', 'Moyen', 'Bon', 'Fort', 'Très fort'];
        text.textContent = strengths[strength];
        text.style.color = this.getStrengthColor(strength);
    }
    
    getStrengthColor(strength) {
        const colors = ['#dc3545', '#fd7e14', '#ffc107', '#28a745', '#20c997', '#198754'];
        return colors[strength] || '#dc3545';
    }
    
    setupFormValidation() {
        const forms = document.querySelectorAll('.auth-form');
        forms.forEach(form => {
            form.addEventListener('submit', (e) => this.validateForm(e));
        });
    }

    // Nouvelle fonction simple pour activer le bouton en live
    setupLiveButtonActivation() {
        const passwordInput = document.getElementById('password');
        const confirmInput = document.getElementById('confirm_password');
        const termsCheckbox = document.getElementById('termsCheckbox');
        const registerBtn = document.getElementById('registerBtn');
        const emailInput = document.getElementById('email');

        if (!passwordInput || !confirmInput || !termsCheckbox || !registerBtn || !emailInput) return;

        const updateButton = () => {
            const passwordsMatch = passwordInput.value === confirmInput.value && passwordInput.value.length > 0;
            const termsAccepted = termsCheckbox.checked;
            const emailValid = emailInput.value.trim() !== '' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.value);
            registerBtn.disabled = !(passwordsMatch && termsAccepted && emailValid);

            // Gestion affichage indicateurs mots de passe
            const passwordMatchDiv = document.getElementById('passwordMatch');
            const passwordMismatchDiv = document.getElementById('passwordMismatch');
            if (passwordsMatch && confirmInput.value.length > 0) {
                if (passwordMatchDiv) passwordMatchDiv.style.display = 'block';
                if (passwordMismatchDiv) passwordMismatchDiv.style.display = 'none';
            } else if (confirmInput.value.length > 0) {
                if (passwordMatchDiv) passwordMatchDiv.style.display = 'none';
                if (passwordMismatchDiv) passwordMismatchDiv.style.display = 'block';
            } else {
                if (passwordMatchDiv) passwordMatchDiv.style.display = 'none';
                if (passwordMismatchDiv) passwordMismatchDiv.style.display = 'none';
            }

        };

        passwordInput.addEventListener('input', updateButton);
        confirmInput.addEventListener('input', updateButton);
        termsCheckbox.addEventListener('change', updateButton);
        emailInput.addEventListener('input', updateButton);
    }
    
    validateForm(e) {
        const form = e.target;
        let isValid = true;
        this.clearAllErrors();

        const email = form.querySelector('input[type="email"]');
        if (email && !this.validateEmail(email.value)) {
            this.showError(email, 'Veuillez entrer une adresse email valide');
            isValid = false;
        }

        const password = form.querySelector('#password');
        if (password && password.value.length < 6) {
            this.showError(password, 'Le mot de passe doit contenir au moins 6 caractères');
            isValid = false;
        }

        const confirmPassword = form.querySelector('#confirm_password');
        if (confirmPassword && password && confirmPassword.value !== password.value) {
            this.showError(confirmPassword, 'Les mots de passe ne correspondent pas');
            isValid = false;
        }

        const terms = form.querySelector('input[name="terms"]');
        if (terms && !terms.checked) {
            this.showError(terms, 'Vous devez accepter les conditions générales');
            isValid = false;
        }

        if (!isValid) e.preventDefault();
    }
    
    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
    
    showError(element, message) {
        const inputGroup = element.closest('.input-with-icon') || element;
        inputGroup.classList.add('error');
        let error = inputGroup.nextElementSibling;
        if (!error || !error.classList.contains('error-message')) {
            error = document.createElement('div');
            error.className = 'error-message';
            inputGroup.parentNode.insertBefore(error, inputGroup.nextSibling);
        }
        error.textContent = message;
    }

    clearError(element) {
        const inputGroup = element.closest('.input-with-icon') || element;
        inputGroup.classList.remove('error');
        const error = inputGroup.nextElementSibling;
        if (error && error.classList.contains('error-message')) error.remove();
    }

    clearAllErrors() {
        document.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
        document.querySelectorAll('.error-message').forEach(el => el.remove());
    }

    showMessage(message, type = 'info') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `auth-message ${type}`;
        messageDiv.textContent = message;
        messageDiv.style.position = 'fixed';
        messageDiv.style.top = '20px';
        messageDiv.style.right = '20px';
        messageDiv.style.padding = '15px 20px';
        messageDiv.style.borderRadius = '8px';
        messageDiv.style.color = 'white';
        messageDiv.style.zIndex = '10000';
        messageDiv.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        messageDiv.style.animation = 'slideIn 0.3s ease';
        messageDiv.style.backgroundColor = type === 'success' ? 'var(--success-color)' :
                                          type === 'error' ? 'var(--error-color)' :
                                          'var(--accent-color)';
        document.body.appendChild(messageDiv);
        setTimeout(() => {
            messageDiv.style.opacity = '0';
            setTimeout(() => messageDiv.remove(), 500);
        }, 3000);
    }
}

// Initialisation
if (document.querySelector('.auth-form')) {
    document.addEventListener('DOMContentLoaded', () => {
        new AuthFormManager();
    });
}
