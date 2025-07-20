
<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=false; section>
    <#if section = "header">
        ${kcSanitize(msg("errorTitle"))?no_esc}
    <#elseif section = "form">
        <div id="kc-form">
            <div id="kc-form-wrapper">
                <div class="brand-header">
                    <div class="brand-logo">
                        <img src="${url.resourcesPath}/img/logo.png" alt="My School Buddies" />
                    </div>
                    <h1 class="brand-title">Error</h1>
                    <p class="brand-subtitle">Something went wrong</p>
                </div>

                <div id="kc-error-message">
                    <div class="alert alert-error">
                        <p class="instruction">
                            ${kcSanitize(message.summary)?no_esc}
                        </p>
                    </div>
                    
                    <#if client?? && client.baseUrl?has_content>
                        <div class="form-submit">
                            <a href="${client.baseUrl}" class="btn btn-primary">${kcSanitize(msg("backToApplication"))?no_esc}</a>
                        </div>
                    <#else>
                        <div class="form-submit">
                            <a href="${url.loginUrl}" class="btn btn-primary">${kcSanitize(msg("backToLogin"))?no_esc}</a>
                        </div>
                    </#if>
                </div>
            </div>
        </div>
    </#if>
</@layout.registrationLayout>
