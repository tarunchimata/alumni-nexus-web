
<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=!messagesPerField.existsError('password','password-confirm') displayInfo=false; section>
    <#if section = "header">
        ${msg("updatePasswordTitle")}
    <#elseif section = "form">
        <div id="kc-form">
            <div id="kc-form-wrapper">
                <div class="brand-header">
                    <div class="brand-logo">
                        <img src="${url.resourcesPath}/img/logo.png" alt="My School Buddies" />
                    </div>
                    <h1 class="brand-title">Update Password</h1>
                    <p class="brand-subtitle">Create a new secure password</p>
                </div>

                <form id="kc-passwd-update-form" action="${url.loginAction}" method="post">
                    <div class="form-group">
                        <label for="password-new" class="form-label">${msg("passwordNew")}</label>
                        <div class="password-field">
                            <input type="password" id="password-new" name="password-new" class="form-control"
                                   autofocus autocomplete="new-password"
                                   aria-invalid="<#if messagesPerField.existsError('password','password-confirm')>true</#if>"
                            />
                            <button type="button" class="password-toggle" onclick="togglePassword('password-new')">
                                <span class="password-show">👁</span>
                                <span class="password-hide" style="display: none;">🙈</span>
                            </button>
                        </div>
                        <div id="password-strength" class="password-strength-container" style="display: none;">
                            <div class="password-strength-bar">
                                <div class="password-strength-fill"></div>
                            </div>
                            <div class="password-strength-text"></div>
                        </div>
                        <#if messagesPerField.existsError('password')>
                            <span id="input-error-password" class="error-message" aria-live="polite">
                                ${kcSanitize(messagesPerField.get('password'))?no_esc}
                            </span>
                        </#if>
                    </div>

                    <div class="form-group">
                        <label for="password-confirm" class="form-label">${msg("passwordConfirm")}</label>
                        <div class="password-field">
                            <input type="password" id="password-confirm" name="password-confirm" class="form-control"
                                   autocomplete="new-password"
                                   aria-invalid="<#if messagesPerField.existsError('password-confirm')>true</#if>"
                            />
                            <button type="button" class="password-toggle" onclick="togglePassword('password-confirm')">
                                <span class="password-show">👁</span>
                                <span class="password-hide" style="display: none;">🙈</span>
                            </button>
                        </div>
                        <#if messagesPerField.existsError('password-confirm')>
                            <span id="input-error-password-confirm" class="error-message" aria-live="polite">
                                ${kcSanitize(messagesPerField.get('password-confirm'))?no_esc}
                            </span>
                        </#if>
                    </div>

                    <div class="form-submit">
                        <input class="btn btn-primary" type="submit" value="${msg("doSubmit")}"/>
                    </div>
                </form>
            </div>
        </div>

        <script>
            function togglePassword(fieldId) {
                const field = document.getElementById(fieldId);
                const button = field.nextElementSibling;
                const showIcon = button.querySelector('.password-show');
                const hideIcon = button.querySelector('.password-hide');
                
                if (field.type === 'password') {
                    field.type = 'text';
                    showIcon.style.display = 'none';
                    hideIcon.style.display = 'inline';
                } else {
                    field.type = 'password';
                    showIcon.style.display = 'inline';
                    hideIcon.style.display = 'none';
                }
            }

            // Password strength meter
            document.getElementById('password-new').addEventListener('input', function(e) {
                const password = e.target.value;
                const strengthContainer = document.getElementById('password-strength');
                const strengthFill = document.querySelector('.password-strength-fill');
                const strengthText = document.querySelector('.password-strength-text');
                
                if (password.length === 0) {
                    strengthContainer.style.display = 'none';
                    return;
                }
                
                strengthContainer.style.display = 'block';
                const strength = getPasswordStrength(password);
                const percentage = (strength / 5) * 100;
                
                strengthFill.style.width = percentage + '%';
                
                if (strength < 2) {
                    strengthFill.className = 'password-strength-fill weak';
                    strengthText.textContent = 'Weak';
                } else if (strength < 4) {
                    strengthFill.className = 'password-strength-fill medium';
                    strengthText.textContent = 'Medium';
                } else {
                    strengthFill.className = 'password-strength-fill strong';
                    strengthText.textContent = 'Strong';
                }
            });

            function getPasswordStrength(password) {
                let strength = 0;
                if (password.length >= 8) strength += 1;
                if (/[a-z]/.test(password)) strength += 1;
                if (/[A-Z]/.test(password)) strength += 1;
                if (/\d/.test(password)) strength += 1;
                if (/[@$!%*?&]/.test(password)) strength += 1;
                return strength;
            }
        </script>
    </#if>
</@layout.registrationLayout>
