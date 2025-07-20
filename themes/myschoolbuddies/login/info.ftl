
<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=false; section>
    <#if section = "header">
        <#if messageHeader??>
            ${messageHeader}
        <#else>
            ${message.summary}
        </#if>
    <#elseif section = "form">
        <div id="kc-form">
            <div id="kc-form-wrapper">
                <div class="brand-header">
                    <div class="brand-logo">
                        <img src="${url.resourcesPath}/img/logo.png" alt="My School Buddies" />
                    </div>
                    <h1 class="brand-title">Information</h1>
                </div>

                <div id="kc-info-message">
                    <p class="instruction">
                        ${kcSanitize(message.summary)?no_esc}
                        <#if requiredActions??>
                            <#list requiredActions as reqActionItem>
                                ${kcSanitize(msg("requiredAction.${reqActionItem}"))?no_esc}
                            </#list>
                        </#if>
                    </p>
                    
                    <#if skipLink??>
                    <#else>
                        <#if pageRedirectUri?has_content>
                            <div class="form-submit">
                                <a href="${pageRedirectUri}" class="btn btn-primary">${kcSanitize(msg("backToApplication"))?no_esc}</a>
                            </div>
                        <#elseif actionUri?has_content>
                            <div class="form-submit">
                                <a href="${actionUri}" class="btn btn-primary">${kcSanitize(msg("proceedWithAction"))?no_esc}</a>
                            </div>
                        <#elseif (client.baseUrl)?has_content>
                            <div class="form-submit">
                                <a href="${client.baseUrl}" class="btn btn-primary">${kcSanitize(msg("backToApplication"))?no_esc}</a>
                            </div>
                        </#if>
                    </#if>
                </div>
            </div>
        </div>
    </#if>
</@layout.registrationLayout>
