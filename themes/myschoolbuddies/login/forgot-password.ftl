
<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=false displayInfo=false; section>
    <#if section = "header">
        ${msg("emailForgotTitle")}
    <#elseif section = "form">
        <div id="kc-form">
            <div id="kc-form-wrapper">
                <div class="brand-header">
                    <div class="brand-logo">
                        <img src="${url.resourcesPath}/img/logo.png" alt="My School Buddies" />
                    </div>
                    <h1 class="brand-title">Reset Password</h1>
                    <p class="brand-subtitle">Enter your email to receive reset instructions</p>
                </div>

                <#if realm.duplicateEmailsAllowed>
                    <div class="alert alert-info">
                        ${msg("emailInstructionUsername")}
                    </div>
                <#else>
                    <div class="alert alert-info">
                        ${msg("emailInstruction")}
                    </div>
                </#if>

                <form id="kc-reset-password-form" action="${url.loginAction}" method="post">
                    <div class="form-group">
                        <label for="username" class="form-label">
                            <#if !realm.loginWithEmailAllowed>${msg("username")}<#elseif !realm.registrationEmailAsUsername>${msg("usernameOrEmail")}<#else>${msg("email")}</#if>
                        </label>
                        <input type="text" id="username" name="username" class="form-control" autofocus value="${(auth.attemptedUsername!'')}" aria-invalid="<#if messagesPerField.existsError('username')>true</#if>" />
                        <#if messagesPerField.existsError('username')>
                            <span id="input-error-username" class="error-message" aria-live="polite">
                                ${kcSanitize(messagesPerField.get('username'))?no_esc}
                            </span>
                        </#if>
                    </div>

                    <div class="form-submit">
                        <input class="btn btn-primary" type="submit" value="${msg("doSubmit")}"/>
                    </div>
                </form>

                <div class="register-link">
                    <p><a href="${url.loginUrl}">${kcSanitize(msg("backToLogin"))?no_esc}</a></p>
                </div>
            </div>
        </div>
    </#if>
</@layout.registrationLayout>
