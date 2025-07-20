
// Password strength meter functionality
(function() {
    'use strict';

    // Initialize password strength meter when DOM is loaded
    document.addEventListener('DOMContentLoaded', function() {
        initPasswordStrength();
    });

    function initPasswordStrength() {
        const passwordFields = document.querySelectorAll('input[type="password"]');
        
        passwordFields.forEach(function(field) {
            if (field.name === 'password' || field.name === 'password-new') {
                setupPasswordStrength(field);
            }
        });
    }

    function setupPasswordStrength(passwordField) {
        passwordField.addEventListener('input', function(e) {
            const password = e.target.value;
            updatePasswordStrength(password);
        });
    }

    function updatePasswordStrength(password) {
        const strengthContainer = document.getElementById('password-strength');
        const strengthFill = document.querySelector('.password-strength-fill');
        const strengthText = document.querySelector('.password-strength-text');
        
        if (!strengthContainer || !strengthFill || !strengthText) {
            return;
        }
        
        if (password.length === 0) {
            strengthContainer.style.display = 'none';
            return;
        }
        
        strengthContainer.style.display = 'block';
        const strength = calculatePasswordStrength(password);
        const percentage = Math.min((strength.score / 5) * 100, 100);
        
        strengthFill.style.width = percentage + '%';
        strengthFill.className = 'password-strength-fill ' + strength.level;
        strengthText.textContent = strength.text;
        
        // Add accessibility
        strengthContainer.setAttribute('aria-live', 'polite');
        strengthContainer.setAttribute('aria-label', 'Password strength: ' + strength.text);
    }

    function calculatePasswordStrength(password) {
        let score = 0;
        let feedback = [];
        
        // Length check
        if (password.length >= 8) {
            score += 1;
        } else {
            feedback.push('Use at least 8 characters');
        }
        
        // Lowercase check
        if (/[a-z]/.test(password)) {
            score += 1;
        } else {
            feedback.push('Add lowercase letters');
        }
        
        // Uppercase check
        if (/[A-Z]/.test(password)) {
            score += 1;
        } else {
            feedback.push('Add uppercase letters');
        }
        
        // Number check
        if (/\d/.test(password)) {
            score += 1;
        } else {
            feedback.push('Add numbers');
        }
        
        // Special character check
        if (/[@$!%*?&]/.test(password)) {
            score += 1;
        } else {
            feedback.push('Add special characters');
        }
        
        // Determine strength level
        let level, text;
        if (score < 2) {
            level = 'weak';
            text = 'Weak';
        } else if (score < 4) {
            level = 'medium';
            text = 'Medium';
        } else {
            level = 'strong';
            text = 'Strong';
        }
        
        return {
            score: score,
            level: level,
            text: text,
            feedback: feedback
        };
    }

    // Password visibility toggle
    window.togglePassword = function(fieldId) {
        const field = document.getElementById(fieldId);
        const button = field.nextElementSibling;
        
        if (!button || !button.classList.contains('password-toggle')) {
            return;
        }
        
        const showIcon = button.querySelector('.password-show');
        const hideIcon = button.querySelector('.password-hide');
        
        if (field.type === 'password') {
            field.type = 'text';
            showIcon.style.display = 'none';
            hideIcon.style.display = 'inline';
            button.setAttribute('aria-label', 'Hide password');
        } else {
            field.type = 'password';
            showIcon.style.display = 'inline';
            hideIcon.style.display = 'none';
            button.setAttribute('aria-label', 'Show password');
        }
    };

    // Form validation helpers
    window.validateForm = function(formId) {
        const form = document.getElementById(formId);
        if (!form) return true;
        
        const requiredFields = form.querySelectorAll('[required]');
        let isValid = true;
        
        requiredFields.forEach(function(field) {
            if (!field.value.trim()) {
                field.setAttribute('aria-invalid', 'true');
                isValid = false;
            } else {
                field.removeAttribute('aria-invalid');
            }
        });
        
        return isValid;
    };

    // Enhanced form submission
    window.enhanceFormSubmission = function(formId) {
        const form = document.getElementById(formId);
        if (!form) return;
        
        form.addEventListener('submit', function(e) {
            const submitButton = form.querySelector('[type="submit"]');
            if (submitButton) {
                submitButton.disabled = true;
                submitButton.textContent = 'Processing...';
                
                // Re-enable after 5 seconds as fallback
                setTimeout(function() {
                    submitButton.disabled = false;
                    submitButton.textContent = submitButton.getAttribute('data-original-text') || 'Submit';
                }, 5000);
            }
        });
    };

})();
