/**
 * Password Strength Meter for My School Buddies Keycloak Theme
 * Production-ready with accessibility and mobile support
 */

(function() {
  'use strict';

  // Password strength configuration
  const strengthConfig = {
    minLength: 8,
    patterns: {
      lowercase: /[a-z]/,
      uppercase: /[A-Z]/,
      numbers: /\d/,
      symbols: /[@$!%*?&]/,
      common: /^(password|123456|qwerty|abc123|letmein|monkey|dragon)$/i
    },
    messages: {
      weak: 'Weak - Add more characters',
      medium: 'Medium - Add special characters',
      strong: 'Strong password',
      veryStrong: 'Very strong password'
    }
  };

  // Initialize password strength meter
  function initPasswordStrength() {
    const passwordFields = document.querySelectorAll('input[type="password"]');
    
    passwordFields.forEach(field => {
      if (field.name === 'password' || field.name === 'password-new') {
        createStrengthMeter(field);
        addPasswordToggle(field);
      }
    });
  }

  // Create strength meter UI
  function createStrengthMeter(passwordField) {
    const container = document.createElement('div');
    container.className = 'password-strength-container';
    container.style.display = 'none';
    
    const bar = document.createElement('div');
    bar.className = 'password-strength-bar';
    
    const fill = document.createElement('div');
    fill.className = 'password-strength-fill';
    
    const text = document.createElement('div');
    text.className = 'password-strength-text';
    text.setAttribute('aria-live', 'polite');
    
    bar.appendChild(fill);
    container.appendChild(bar);
    container.appendChild(text);
    
    passwordField.parentNode.insertBefore(container, passwordField.nextSibling);
    
    // Add event listener
    passwordField.addEventListener('input', function() {
      updateStrengthMeter(this.value, fill, text, container);
    });
    
    // Add focus/blur events
    passwordField.addEventListener('focus', function() {
      if (this.value.length > 0) {
        container.style.display = 'block';
      }
    });
    
    passwordField.addEventListener('blur', function() {
      if (this.value.length === 0) {
        container.style.display = 'none';
      }
    });
  }

  // Calculate password strength
  function calculateStrength(password) {
    if (!password) return 0;
    
    let score = 0;
    const checks = {
      length: password.length >= strengthConfig.minLength,
      lowercase: strengthConfig.patterns.lowercase.test(password),
      uppercase: strengthConfig.patterns.uppercase.test(password),
      numbers: strengthConfig.patterns.numbers.test(password),
      symbols: strengthConfig.patterns.symbols.test(password),
      notCommon: !strengthConfig.patterns.common.test(password)
    };
    
    // Base score from length
    if (checks.length) score += 1;
    if (password.length >= 12) score += 1;
    
    // Character variety
    if (checks.lowercase) score += 1;
    if (checks.uppercase) score += 1;
    if (checks.numbers) score += 1;
    if (checks.symbols) score += 1;
    
    // Penalty for common passwords
    if (!checks.notCommon) score -= 2;
    
    // Bonus for very long passwords
    if (password.length >= 16) score += 1;
    
    return Math.max(0, Math.min(5, score));
  }

  // Update strength meter display
  function updateStrengthMeter(password, fill, text, container) {
    if (password.length === 0) {
      container.style.display = 'none';
      return;
    }
    
    container.style.display = 'block';
    const strength = calculateStrength(password);
    const percentage = (strength / 5) * 100;
    
    fill.style.width = percentage + '%';
    
    // Update visual style and text
    fill.className = 'password-strength-fill';
    if (strength <= 2) {
      fill.classList.add('weak');
      text.textContent = strengthConfig.messages.weak;
    } else if (strength <= 3) {
      fill.classList.add('medium');
      text.textContent = strengthConfig.messages.medium;
    } else if (strength <= 4) {
      fill.classList.add('strong');
      text.textContent = strengthConfig.messages.strong;
    } else {
      fill.classList.add('strong');
      text.textContent = strengthConfig.messages.veryStrong;
    }
    
    // Update ARIA attributes
    fill.setAttribute('aria-valuenow', strength);
    fill.setAttribute('aria-valuemin', '0');
    fill.setAttribute('aria-valuemax', '5');
    fill.setAttribute('aria-label', `Password strength: ${text.textContent}`);
  }

  // Add password toggle functionality
  function addPasswordToggle(passwordField) {
    // Skip if toggle already exists
    if (passwordField.parentNode.querySelector('.password-toggle')) {
      return;
    }
    
    const wrapper = document.createElement('div');
    wrapper.className = 'password-field';
    
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'password-toggle';
    toggle.setAttribute('aria-label', 'Toggle password visibility');
    
    const showIcon = document.createElement('span');
    showIcon.className = 'password-show';
    showIcon.textContent = '👁';
    
    const hideIcon = document.createElement('span');
    hideIcon.className = 'password-hide';
    hideIcon.textContent = '🙈';
    hideIcon.style.display = 'none';
    
    toggle.appendChild(showIcon);
    toggle.appendChild(hideIcon);
    
    // Insert wrapper
    passwordField.parentNode.insertBefore(wrapper, passwordField);
    wrapper.appendChild(passwordField);
    wrapper.appendChild(toggle);
    
    // Add click handler
    toggle.addEventListener('click', function() {
      const isPassword = passwordField.type === 'password';
      
      passwordField.type = isPassword ? 'text' : 'password';
      showIcon.style.display = isPassword ? 'none' : 'inline';
      hideIcon.style.display = isPassword ? 'inline' : 'none';
      
      // Update ARIA label
      toggle.setAttribute('aria-label', 
        isPassword ? 'Hide password' : 'Show password'
      );
      
      // Keep focus on password field
      passwordField.focus();
    });
  }

  // Real-time validation feedback
  function addValidationFeedback() {
    const form = document.querySelector('#kc-form-login, #kc-register-form, #kc-passwd-update-form');
    if (!form) return;
    
    const inputs = form.querySelectorAll('input[required]');
    
    inputs.forEach(input => {
      input.addEventListener('blur', function() {
        validateField(this);
      });
      
      input.addEventListener('input', function() {
        // Clear error state on input
        this.setAttribute('aria-invalid', 'false');
        const errorMsg = this.parentNode.querySelector('.error-message');
        if (errorMsg) {
          errorMsg.style.display = 'none';
        }
      });
    });
  }

  // Validate individual field
  function validateField(field) {
    const value = field.value.trim();
    let isValid = true;
    let errorMessage = '';
    
    // Required field validation
    if (field.hasAttribute('required') && !value) {
      isValid = false;
      errorMessage = 'This field is required';
    }
    
    // Email validation
    if (field.type === 'email' && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        isValid = false;
        errorMessage = 'Please enter a valid email address';
      }
    }
    
    // Password validation
    if (field.type === 'password' && value && field.name === 'password') {
      if (value.length < strengthConfig.minLength) {
        isValid = false;
        errorMessage = `Password must be at least ${strengthConfig.minLength} characters`;
      }
    }
    
    // Username validation
    if (field.name === 'username' && value) {
      if (value.length < 3) {
        isValid = false;
        errorMessage = 'Username must be at least 3 characters';
      }
    }
    
    // Update field state
    field.setAttribute('aria-invalid', !isValid);
    
    // Show/hide error message
    let errorElement = field.parentNode.querySelector('.error-message');
    if (!errorElement && !isValid) {
      errorElement = document.createElement('span');
      errorElement.className = 'error-message';
      errorElement.setAttribute('aria-live', 'polite');
      field.parentNode.appendChild(errorElement);
    }
    
    if (errorElement) {
      if (!isValid) {
        errorElement.textContent = errorMessage;
        errorElement.style.display = 'block';
      } else {
        errorElement.style.display = 'none';
      }
    }
  }

  // Form submission enhancement
  function enhanceFormSubmission() {
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
      form.addEventListener('submit', function(e) {
        const submitBtn = this.querySelector('input[type="submit"], button[type="submit"]');
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.classList.add('btn-loading');
          
          // Re-enable after 5 seconds as fallback
          setTimeout(() => {
            submitBtn.disabled = false;
            submitBtn.classList.remove('btn-loading');
          }, 5000);
        }
      });
    });
  }

  // Mobile enhancements
  function addMobileEnhancements() {
    // Prevent zoom on iOS when focusing inputs
    if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
      const inputs = document.querySelectorAll('input[type="text"], input[type="email"], input[type="password"]');
      inputs.forEach(input => {
        if (window.innerWidth < 768) {
          input.style.fontSize = '16px';
        }
      });
    }
    
    // Add touch-friendly spacing
    if ('ontouchstart' in window) {
      document.body.classList.add('touch-device');
    }
  }

  // Initialize all features when DOM is ready
  function init() {
    initPasswordStrength();
    addValidationFeedback();
    enhanceFormSubmission();
    addMobileEnhancements();
  }

  // Run initialization
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Export for global access if needed
  window.MySchoolBuddiesAuth = {
    calculateStrength: calculateStrength,
    validateField: validateField
  };

})();
