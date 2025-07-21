
<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=!messagesPerField.existsError('email') displayInfo=false; section>
    <#if section = "header">
        ${msg("updateEmailTitle")}
    <#elseif section = "form">
        <div id="kc-form">
            <div id="kc-form-wrapper">
                <div class="brand-header">
                    <div class="brand-logo">
                        <img src="${url.resourcesPath}/img/logo.png" alt="My School Buddies" />
                    </div>
                    <h1 class="brand-title">Update Email</h1>
                    <p class="brand-subtitle">Enter your new email address</p>
                </div>

                <form id="kc-update-email-form" action="${url.loginAction}" method="post">
                    <div class="form-group">
                        <label for="email" class="form-label">${msg("email")}</label>
                        <input type="email" id="email" name="email" class="form-control"
                               value="${(email.value!'')}" autofocus
                               aria-invalid="<#if messagesPerField.existsError('email')>true</#if>"
                        />
                        <#if messagesPerField.existsError('email')>
                            <span id="input-error-email" class="error-message" aria-live="polite">
                                ${kcSanitize(messagesPerField.get('email'))?no_esc}
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
