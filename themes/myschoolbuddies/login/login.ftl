<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=!messagesPerField.existsError('username','password') displayInfo=realm.password && realm.registrationAllowed && !registrationDisabled??; section>
    <#if section = "header">
        ${msg("doLogIn")}
    <#elseif section = "form">
    <div id="kc-form">
      <div id="kc-form-wrapper">
        <div class="brand-header">
          <div class="brand-logo">
            <img src="${url.resourcesPath}/img/logo.png" alt="My School Buddies" />
          </div>
          <h1 class="brand-title">My School Buddies</h1>
          <p class="brand-subtitle">Welcome back to your school community</p>
        </div>

        <#if realm.password>
            <form id="kc-form-login" onsubmit="login.disabled = true; return true;" action="${url.loginAction}" method="post">
                <div class="form-group">
                    <label for="username" class="form-label">
                        <#if !realm.loginWithEmailAllowed>${msg("username")}<#elseif !realm.registrationEmailAsUsername>${msg("usernameOrEmail")}<#else>${msg("email")}</#if>
                    </label>
                    <#if usernameEditDisabled??>
                        <input tabindex="1" id="username" class="form-control" name="username" value="${(login.username!'')}" type="text" disabled />
                    <#else>
                        <input tabindex="1" id="username" class="form-control" name="username" value="${(login.username!'')}"  type="text" autofocus autocomplete="off"
                               aria-invalid="<#if messagesPerField.existsError('username','password')>true</#if>"
                        />
                    </#if>
                    <#if messagesPerField.existsError('username','password')>
                        <span id="input-error" class="error-message" aria-live="polite">
                            ${kcSanitize(messagesPerField.getFirstError('username','password'))?no_esc}
                        </span>
                    </#if>
                </div>

                <div class="form-group">
                    <label for="password" class="form-label">${msg("password")}</label>
                    <div class="password-field">
                        <input tabindex="2" id="password" class="form-control" name="password" type="password" autocomplete="off"
                               aria-invalid="<#if messagesPerField.existsError('username','password')>true</#if>"
                        />
                        <button type="button" class="password-toggle" onclick="togglePassword()">
                            <span class="password-show">👁</span>
                            <span class="password-hide" style="display: none;">🙈</span>
                        </button>
                    </div>
                </div>

                <div class="form-options">
                    <#if realm.rememberMe && !usernameEditDisabled??>
                        <div class="checkbox">
                            <label>
                                <#if login.rememberMe??>
                                    <input tabindex="3" id="rememberMe" name="rememberMe" type="checkbox" checked> ${msg("rememberMe")}
                                <#else>
                                    <input tabindex="3" id="rememberMe" name="rememberMe" type="checkbox"> ${msg("rememberMe")}
                                </#if>
                            </label>
                        </div>
                    </#if>
                    <#if realm.resetPasswordAllowed>
                        <div class="forgot-password">
                            <a tabindex="5" href="${url.loginResetCredentialsUrl}">${msg("doForgotPassword")}</a>
                        </div>
                    </#if>
                </div>

                <div class="form-submit">
                    <input type="hidden" id="id-hidden-input" name="credentialId" <#if auth.selectedCredential?has_content>value="${auth.selectedCredential}"</#if>/>
                    <input tabindex="4" class="btn btn-primary" name="login" id="kc-login" type="submit" value="${msg("doLogIn")}"/>
                </div>
            </form>
        </#if>

        <#if realm.password && realm.registrationAllowed && !registrationDisabled??>
            <div class="register-link">
                <p>Don't have an account? <a href="${url.registrationUrl}">${msg("doRegister")}</a></p>
            </div>
        </#if>

        <#if realm.password && social.providers??>
            <div class="social-login">
                <div class="divider">
                    <span>Or continue with</span>
                </div>
                <div class="social-providers">
                    <#list social.providers as p>
                        <a id="social-${p.alias}" class="btn btn-social btn-${p.alias}" type="button" href="${p.loginUrl}">
                            <#if p.iconClasses?has_content>
                                <i class="${properties.kcCommonLogoIdP!} ${p.iconClasses!}" aria-hidden="true"></i>
                                <span class="${properties.kcFormSocialAccountNameClass!}">${p.displayName!}</span>
                            <#else>
                                <span class="${properties.kcFormSocialAccountNameClass!}">${p.displayName!}</span>
                            </#if>
                        </a>
                    </#list>
                </div>
            </div>
        </#if>
      </div>
    </div>

    <script>
        function togglePassword() {
            const passwordField = document.getElementById('password');
            const showIcon = document.querySelector('.password-show');
            const hideIcon = document.querySelector('.password-hide');
            
            if (passwordField.type === 'password') {
                passwordField.type = 'text';
                showIcon.style.display = 'none';
                hideIcon.style.display = 'inline';
            } else {
                passwordField.type = 'password';
                showIcon.style.display = 'inline';
                hideIcon.style.display = 'none';
            }
        }
    </script>
    <#elseif section = "info" >
        <#if realm.password && realm.registrationAllowed && !registrationDisabled??>
            <div id="kc-registration-container">
                <div id="kc-registration">
                    <span>${msg("noAccount")} <a tabindex="6"
                                                 href="${url.registrationUrl}">${msg("doRegister")}</a></span>
                </div>
            </div>
        </#if>
    </#if>

</@layout.registrationLayout>