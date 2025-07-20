
<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=!messagesPerField.existsError('firstName','lastName','email','username','password','password-confirm') displayInfo=false; section>
    <#if section = "header">
        ${msg("registerTitle")}
    <#elseif section = "form">
        <div id="kc-form">
            <div id="kc-form-wrapper">
                <div class="brand-header">
                    <div class="brand-logo">
                        <img src="${url.resourcesPath}/img/logo.png" alt="My School Buddies" />
                    </div>
                    <h1 class="brand-title">My School Buddies</h1>
                    <p class="brand-subtitle">Join your school community</p>
                </div>

                <#if realm.password>
                    <form id="kc-register-form" action="${url.registrationAction}" method="post">
                        <div class="form-group">
                            <label for="firstName" class="form-label">${msg("firstName")}</label>
                            <input type="text" id="firstName" class="form-control" name="firstName"
                                   value="${(register.formData.firstName!'')}" 
                                   aria-invalid="<#if messagesPerField.existsError('firstName')>true</#if>"
                            />
                            <#if messagesPerField.existsError('firstName')>
                                <span class="error-message" aria-live="polite">
                                    ${kcSanitize(messagesPerField.get('firstName'))?no_esc}
                                </span>
                            </#if>
                        </div>

                        <div class="form-group">
                            <label for="lastName" class="form-label">${msg("lastName")}</label>
                            <input type="text" id="lastName" class="form-control" name="lastName"
                                   value="${(register.formData.lastName!'')}"
                                   aria-invalid="<#if messagesPerField.existsError('lastName')>true</#if>"
                            />
                            <#if messagesPerField.existsError('lastName')>
                                <span class="error-message" aria-live="polite">
                                    ${kcSanitize(messagesPerField.get('lastName'))?no_esc}
                                </span>
                            </#if>
                        </div>

                        <div class="form-group">
                            <label for="email" class="form-label">${msg("email")}</label>
                            <input type="email" id="email" class="form-control" name="email"
                                   value="${(register.formData.email!'')}" autocomplete="email"
                                   aria-invalid="<#if messagesPerField.existsError('email')>true</#if>"
                            />
                            <#if messagesPerField.existsError('email')>
                                <span class="error-message" aria-live="polite">
                                    ${kcSanitize(messagesPerField.get('email'))?no_esc}
                                </span>
                            </#if>
                        </div>

                        <#if !realm.registrationEmailAsUsername>
                            <div class="form-group">
                                <label for="username" class="form-label">${msg("username")}</label>
                                <input type="text" id="username" class="form-control" name="username"
                                       value="${(register.formData.username!'')}" 
                                       autocomplete="username"
                                       aria-invalid="<#if messagesPerField.existsError('username')>true</#if>"
                                />
                                <#if messagesPerField.existsError('username')>
                                    <span class="error-message" aria-live="polite">
                                        ${kcSanitize(messagesPerField.get('username'))?no_esc}
                                    </span>
                                </#if>
                            </div>
                        </#if>

                        <div class="form-group">
                            <label for="password" class="form-label">${msg("password")}</label>
                            <div class="password-field">
                                <input type="password" id="password" class="form-control" name="password"
                                       autocomplete="new-password"
                                       aria-invalid="<#if messagesPerField.existsError('password','password-confirm')>true</#if>"
                                />
                                <button type="button" class="password-toggle" onclick="togglePassword('password')">
                                    <span class="password-show">👁</span>
                                    <span class="password-hide" style="display: none;">🙈</span>
                                </button>
                            </div>
                            <#if messagesPerField.existsError('password')>
                                <span class="error-message" aria-live="polite">
                                    ${kcSanitize(messagesPerField.get('password'))?no_esc}
                                </span>
                            </#if>
                        </div>

                        <div class="form-group">
                            <label for="password-confirm" class="form-label">${msg("passwordConfirm")}</label>
                            <div class="password-field">
                                <input type="password" id="password-confirm" class="form-control" name="password-confirm"
                                       autocomplete="new-password"
                                       aria-invalid="<#if messagesPerField.existsError('password-confirm')>true</#if>"
                                />
                                <button type="button" class="password-toggle" onclick="togglePassword('password-confirm')">
                                    <span class="password-show">👁</span>
                                    <span class="password-hide" style="display: none;">🙈</span>
                                </button>
                            </div>
                            <#if messagesPerField.existsError('password-confirm')>
                                <span class="error-message" aria-live="polite">
                                    ${kcSanitize(messagesPerField.get('password-confirm'))?no_esc}
                                </span>
                            </#if>
                        </div>

                        <#if recaptchaRequired??>
                            <div class="form-group">
                                <div class="g-recaptcha" data-size="compact" data-sitekey="${recaptchaSiteKey}"></div>
                            </div>
                        </#if>

                        <div class="form-submit">
                            <input class="btn btn-primary" type="submit" value="${msg("doRegister")}"/>
                        </div>
                    </form>
                </#if>

                <div class="register-link">
                    <p>
                        ${kcSanitize(msg("alreadyHaveAccount"))?no_esc}
                        <a href="${url.loginUrl}">${msg("doLogIn")}</a>
                    </p>
                </div>
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
            document.getElementById('password').addEventListener('input', function(e) {
                const password = e.target.value;
                const strength = getPasswordStrength(password);
                showPasswordStrength(strength);
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

            function showPasswordStrength(strength) {
                // Implementation for password strength display
                // This would show visual feedback to the user
            }
        </script>
    </#elseif>
</@layout.registrationLayout>
