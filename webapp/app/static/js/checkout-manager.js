// checkout-manager.js - Gestion de la page de paiement

class CheckoutManager {
    constructor() {
        this.currentStep = 1;
        this.formData = {
            shipping: {},
            delivery: null,
            payment: null,
            card: {}
        };
        this.init();
    }
    
    init() {
        this.setupSteps();
        this.setupAddressForm();
        this.setupDeliveryOptions();
        this.setupPaymentMethods();
        this.setupCardForm();
        this.setupNavigation();
        this.setupOrderReview();
    }
    
    // Gestion des étapes
    setupSteps() {
        this.updateStepIndicators();
        
        // Vérifier si on a une étape sauvegardée
        const savedStep = localStorage.getItem('checkout_step');
        if (savedStep) {
            this.goToStep(parseInt(savedStep));
        }
    }
    
    updateStepIndicators() {
        document.querySelectorAll('.step').forEach((step, index) => {
            const stepNumber = index + 1;
            
            if (stepNumber < this.currentStep) {
                step.classList.remove('active');
                step.classList.add('completed');
            } else if (stepNumber === this.currentStep) {
                step.classList.add('active');
                step.classList.remove('completed');
            } else {
                step.classList.remove('active', 'completed');
            }
        });
    }
    
    goToStep(stepNumber) {
        this.currentStep = stepNumber;
        localStorage.setItem('checkout_step', stepNumber);
        
        // Cacher toutes les sections
        document.querySelectorAll('.form-section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Afficher la section active
        const activeSection = document.getElementById(`step-${stepNumber}`);
        if (activeSection) {
            activeSection.classList.add('active');
        }
        
        this.updateStepIndicators();
        this.updateNavigationButtons();
    }
    
    nextStep() {
        if (this.validateCurrentStep()) {
            if (this.currentStep < 4) {
                this.goToStep(this.currentStep + 1);
            } else {
                this.completeOrder();
            }
        }
    }
    
    prevStep() {
        if (this.currentStep > 1) {
            this.goToStep(this.currentStep - 1);
        }
    }
    
    // Validation des étapes
    validateCurrentStep() {
        switch(this.currentStep) {
            case 1: // Adresse
                return this.validateShippingAddress();
            case 2: // Livraison
                return this.validateDelivery();
            case 3: // Paiement
                return this.validatePayment();
            case 4: // Revue
                return this.validateReview();
            default:
                return true;
        }
    }
    
    validateShippingAddress() {
        const requiredFields = ['first_name', 'last_name', 'address', 'city', 'zip', 'country'];
        let isValid = true;
        
        requiredFields.forEach(field => {
            const input = document.getElementById(field);
            if (input && !input.value.trim()) {
                this.showFieldError(input, 'Ce champ est obligatoire');
                isValid = false;
            } else {
                this.clearFieldError(input);
            }
        });
        
        // Validation email
        const emailInput = document.getElementById('email');
        if (emailInput && !this.validateEmail(emailInput.value)) {
            this.showFieldError(emailInput, 'Email invalide');
            isValid = false;
        }
        
        return isValid;
    }
    
    validateDelivery() {
        const selectedOption = document.querySelector('.delivery-option.selected');
        if (!selectedOption) {
            this.showMessage('Veuillez sélectionner une option de livraison', 'error');
            return false;
        }
        return true;
    }
    
    validatePayment() {
        const selectedMethod = document.querySelector('.payment-method.selected');
        if (!selectedMethod) {
            this.showMessage('Veuillez sélectionner un mode de paiement', 'error');
            return false;
        }
        
        // Validation carte de crédit si sélectionnée
        if (selectedMethod.getAttribute('data-method') === 'card') {
            return this.validateCardForm();
        }
        
        return true;
    }
    
    validateReview() {
        // Vérifier si le panier est toujours valide
        if (typeof window.cartManager !== 'undefined' && window.cartManager.cart.length === 0) {
            this.showMessage('Votre panier est vide', 'error');
            return false;
        }
        return true;
    }
    
    validateCardForm() {
        const requiredFields = ['card_number', 'card_name', 'card_expiry', 'card_cvc'];
        let isValid = true;
        
        requiredFields.forEach(field => {
            const input = document.getElementById(field);
            if (input && !input.value.trim()) {
                this.showFieldError(input, 'Ce champ est obligatoire');
                isValid = false;
            } else {
                this.clearFieldError(input);
            }
        });
        
        // Validation numéro de carte
        const cardNumber = document.getElementById('card_number');
        if (cardNumber && !this.validateCardNumber(cardNumber.value)) {
            this.showFieldError(cardNumber, 'Numéro de carte invalide');
            isValid = false;
        }
        
        return isValid;
    }
    
    // Formulaires
    setupAddressForm() {
        // Basculer entre nouvelle adresse et adresse sauvegardée
        document.querySelectorAll('.saved-address').forEach(address => {
            address.addEventListener('click', (e) => {
                document.querySelectorAll('.saved-address').forEach(addr => {
                    addr.classList.remove('selected');
                });
                e.currentTarget.classList.add('selected');
                
                // Remplir automatiquement le formulaire
                this.fillAddressFromSaved(e.currentTarget);
            });
        });
    }
    
    fillAddressFromSaved(addressElement) {
        const addressId = addressElement.getAttribute('data-address-id');
        // Ici vous feriez un appel API pour récupérer l'adresse
        // Pour l'exemple, on simule
        const mockAddress = {
            first_name: 'John',
            last_name: 'Doe',
            address: '123 Rue de la Paix',
            city: 'Paris',
            zip: '75001',
            country: 'France'
        };
        
        Object.keys(mockAddress).forEach(field => {
            const input = document.getElementById(field);
            if (input) input.value = mockAddress[field];
        });
    }
    
    setupDeliveryOptions() {
        document.querySelectorAll('.delivery-option').forEach(option => {
            option.addEventListener('click', (e) => {
                document.querySelectorAll('.delivery-option').forEach(opt => {
                    opt.classList.remove('selected');
                });
                e.currentTarget.classList.add('selected');
                
                // Mettre à jour le prix de livraison dans le récapitulatif
                this.updateShippingSummary(e.currentTarget);
            });
        });
    }
    
    updateShippingSummary(option) {
        const shippingPrice = option.getAttribute('data-price') || '0';
        const shippingElement = document.getElementById('shipping-total');
        if (shippingElement) {
            if (parseFloat(shippingPrice) === 0) {
                shippingElement.textContent = 'GRATUITE';
            } else {
                shippingElement.textContent = `€${parseFloat(shippingPrice).toFixed(2)}`;
            }
        }
        
        this.updateOrderTotal();
    }
    
    setupPaymentMethods() {
        document.querySelectorAll('.payment-method').forEach(method => {
            method.addEventListener('click', (e) => {
                document.querySelectorAll('.payment-method').forEach(m => {
                    m.classList.remove('selected');
                });
                e.currentTarget.classList.add('selected');
                
                // Afficher/masquer le formulaire de carte
                const methodType = e.currentTarget.getAttribute('data-method');
                const cardForm = document.querySelector('.card-form');
                if (cardForm) {
                    if (methodType === 'card') {
                        cardForm.style.display = 'grid';
                    } else {
                        cardForm.style.display = 'none';
                    }
                }
            });
        });
    }
    
    setupCardForm() {
        // Formatage numéro de carte
        const cardNumberInput = document.getElementById('card_number');
        if (cardNumberInput) {
            cardNumberInput.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\D/g, '');
                value = value.replace(/(\d{4})/g, '$1 ').trim();
                e.target.value = value.substring(0, 19); // 16 chiffres + 3 espaces
                
                // Détecter le type de carte
                this.detectCardType(value);
            });
        }
        
        // Formatage date d'expiration
        const expiryInput = document.getElementById('card_expiry');
        if (expiryInput) {
            expiryInput.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\D/g, '');
                if (value.length >= 2) {
                    value = value.substring(0, 2) + '/' + value.substring(2, 4);
                }
                e.target.value = value.substring(0, 5);
            });
        }
    }
    
    detectCardType(cardNumber) {
        const cardIcons = document.querySelector('.card-icons');
        if (!cardIcons) return;
        
        // Réinitialiser toutes les icônes
        cardIcons.querySelectorAll('i').forEach(icon => {
            icon.style.opacity = '0.3';
        });
        
        // Détecter le type de carte
        let cardType = 'unknown';
        const firstDigit = cardNumber.charAt(0);
        
        if (firstDigit === '4') {
            cardType = 'visa';
        } else if (firstDigit === '5') {
            cardType = 'mastercard';
        } else if (firstDigit === '3') {
            cardType = 'amex';
        }
        
        // Mettre en évidence l'icône correspondante
        const activeIcon = cardIcons.querySelector(`.fa-cc-${cardType}`);
        if (activeIcon) {
            activeIcon.style.opacity = '1';
        }
    }
    
    // Navigation
    setupNavigation() {
        const nextBtn = document.querySelector('.btn-next');
        const backBtn = document.querySelector('.btn-back');
        const confirmBtn = document.querySelector('.btn-confirm');
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.nextStep());
        }
        
        if (backBtn) {
            backBtn.addEventListener('click', () => this.prevStep());
        }
        
        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => this.completeOrder());
        }
        
        this.updateNavigationButtons();
    }
    
    updateNavigationButtons() {
        const nextBtn = document.querySelector('.btn-next');
        const backBtn = document.querySelector('.btn-back');
        const confirmBtn = document.querySelector('.btn-confirm');
        
        if (nextBtn && backBtn) {
            if (this.currentStep === 1) {
                backBtn.style.visibility = 'hidden';
            } else {
                backBtn.style.visibility = 'visible';
            }
            
            if (this.currentStep === 4) {
                nextBtn.style.display = 'none';
                if (confirmBtn) confirmBtn.style.display = 'flex';
            } else {
                nextBtn.style.display = 'flex';
                if (confirmBtn) confirmBtn.style.display = 'none';
            }
        }
    }
    
    // Revue de commande
    setupOrderReview() {
        this.updateOrderSummary();
        
        // Actualiser le récapitulatif quand le panier change
        if (typeof window.cartManager !== 'undefined') {
            // Observer les changements du panier
            const originalSaveCart = window.cartManager.saveCart;
            window.cartManager.saveCart = function() {
                originalSaveCart.apply(this);
                this.updateOrderSummary();
            }.bind(this);
        }
    }
    
    updateOrderSummary() {
        // Récupérer les articles du panier
        let items = [];
        if (typeof window.cartManager !== 'undefined') {
            items = window.cartManager.cart;
        } else if (typeof window.cart !== 'undefined') {
            items = window.cart.items;
        }
        
        // Calculer les totaux
        const subtotal = items.reduce((total, item) => {
            // Ici vous devriez récupérer le prix réel depuis l'API
            return total + (item.quantity * 20); // Prix fictif
        }, 0);
        
        // Mettre à jour l'affichage
        const subtotalElement = document.getElementById('order-subtotal');
        const totalElement = document.getElementById('order-total');
        
        if (subtotalElement) {
            subtotalElement.textContent = `€${subtotal.toFixed(2)}`;
        }
        
        if (totalElement) {
            const shipping = parseFloat(document.querySelector('.delivery-option.selected')?.getAttribute('data-price') || '0');
            const tax = subtotal * 0.1; // 10% de TVA
            const total = subtotal + shipping + tax;
            totalElement.textContent = `€${total.toFixed(2)}`;
        }
    }
    
    updateOrderTotal() {
        // Mettre à jour le total avec les frais de livraison
        const subtotalElement = document.getElementById('order-subtotal');
        const totalElement = document.getElementById('order-total');
        
        if (subtotalElement && totalElement) {
            const subtotal = parseFloat(subtotalElement.textContent.replace('€', ''));
            const shipping = parseFloat(document.querySelector('.delivery-option.selected')?.getAttribute('data-price') || '0');
            const tax = subtotal * 0.1;
            const total = subtotal + shipping + tax;
            totalElement.textContent = `€${total.toFixed(2)}`;
        }
    }
    
    // Compléter la commande
    async completeOrder() {
        try {
            // Récupérer toutes les données du formulaire
            this.collectFormData();
            
            // Afficher le chargement
            const confirmBtn = document.querySelector('.btn-confirm');
            if (confirmBtn) {
                const originalText = confirmBtn.innerHTML;
                confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Traitement...';
                confirmBtn.disabled = true;
                
                // Simuler le traitement de la commande
                setTimeout(async () => {
                    // Envoyer la commande au serveur
                    const orderData = {
                        shipping: this.formData.shipping,
                        delivery: this.formData.delivery,
                        payment: this.formData.payment,
                        items: window.cartManager?.cart || window.cart?.items || []
                    };
                    
                    // Ici, vous feriez un appel API réel
                    // const response = await fetch('/api/orders', {
                    //     method: 'POST',
                    //     headers: {'Content-Type': 'application/json'},
                    //     body: JSON.stringify(orderData)
                    // });
                    
                    // Simuler une réponse réussie
                    const success = true; // response.ok
                    
                    if (success) {
                        // Vider le panier
                        if (window.cartManager) {
                            window.cartManager.clearCart();
                        } else if (window.cart) {
                            window.cart.clearCart();
                        }
                        
                        // Rediriger vers la page de confirmation
                        window.location.href = '/order-confirmation';
                    } else {
                        this.showMessage('Erreur lors du traitement de la commande', 'error');
                        confirmBtn.innerHTML = originalText;
                        confirmBtn.disabled = false;
                    }
                }, 2000);
            }
        } catch (error) {
            console.error('Erreur de commande:', error);
            this.showMessage('Une erreur est survenue', 'error');
        }
    }
    
    collectFormData() {
        // Adresse
        document.querySelectorAll('#step-1 input, #step-1 select').forEach(input => {
            if (input.name) {
                this.formData.shipping[input.name] = input.value;
            }
        });
        
        // Livraison
        const selectedDelivery = document.querySelector('.delivery-option.selected');
        if (selectedDelivery) {
            this.formData.delivery = {
                id: selectedDelivery.getAttribute('data-id'),
                name: selectedDelivery.querySelector('h4').textContent,
                price: selectedDelivery.getAttribute('data-price')
            };
        }
        
        // Paiement
        const selectedPayment = document.querySelector('.payment-method.selected');
        if (selectedPayment) {
            this.formData.payment = {
                method: selectedPayment.getAttribute('data-method'),
                name: selectedPayment.querySelector('h4').textContent
            };
            
            // Détails carte
            if (this.formData.payment.method === 'card') {
                document.querySelectorAll('.card-form input').forEach(input => {
                    if (input.name) {
                        this.formData.card[input.name.replace('card_', '')] = input.value;
                    }
                });
            }
        }
    }
    
    // Utilitaires
    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
    
    validateCardNumber(cardNumber) {
        const cleaned = cardNumber.replace(/\s/g, '');
        return /^\d{16}$/.test(cleaned);
    }
    
    showFieldError(input, message) {
        this.clearFieldError(input);
        
        const error = document.createElement('div');
        error.className = 'field-error';
        error.style.color = 'var(--error-color)';
        error.style.fontSize = '14px';
        error.style.marginTop = '5px';
        error.textContent = message;
        
        input.parentNode.appendChild(error);
        input.style.borderColor = 'var(--error-color)';
    }
    
    clearFieldError(input) {
        const error = input.parentNode.querySelector('.field-error');
        if (error) {
            error.remove();
        }
        input.style.borderColor = '';
    }
    
    showMessage(message, type = 'info') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `checkout-message ${type}`;
        messageDiv.textContent = message;
        
        // Styles
        messageDiv.style.position = 'fixed';
        messageDiv.style.top = '20px';
        messageDiv.style.right = '20px';
        messageDiv.style.padding = '15px 20px';
        messageDiv.style.borderRadius = '8px';
        messageDiv.style.color = 'white';
        messageDiv.style.zIndex = '10000';
        messageDiv.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        messageDiv.style.animation = 'slideIn 0.3s ease';
        
        if (type === 'success') {
            messageDiv.style.backgroundColor = 'var(--success-color)';
        } else if (type === 'error') {
            messageDiv.style.backgroundColor = 'var(--error-color)';
        } else {
            messageDiv.style.backgroundColor = 'var(--accent-color)';
        }
        
        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
            messageDiv.style.opacity = '0';
            setTimeout(() => messageDiv.remove(), 500);
        }, 3000);
    }
}

// Initialisation
if (document.querySelector('.checkout-container')) {
    document.addEventListener('DOMContentLoaded', () => {
        window.checkoutManager = new CheckoutManager();
    });
}