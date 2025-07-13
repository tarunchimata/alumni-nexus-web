
export class PKCEService {
  // Generate PKCE code verifier (128 character base64url string)
  generateCodeVerifier(): string {
    const array = new Uint8Array(96);
    crypto.getRandomValues(array);
    const verifier = btoa(String.fromCharCode(...array))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '')
      .substring(0, 128);
    
    console.log('[OAuth2] Generated code verifier', { length: verifier.length, preview: verifier.substring(0, 10) + '...' });
    return verifier;
  }

  // Generate SHA256 code challenge from verifier
  async generateCodeChallenge(verifier: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const digest = await crypto.subtle.digest('SHA-256', data);
    const challenge = btoa(String.fromCharCode(...new Uint8Array(digest)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
    
    console.log('[OAuth2] Generated code challenge', { 
      verifierPreview: verifier.substring(0, 10) + '...',
      challengePreview: challenge.substring(0, 10) + '...'
    });
    return challenge;
  }

  // Generate secure random state for CSRF protection
  generateState(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    const state = btoa(String.fromCharCode(...array))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
    
    console.log('[OAuth2] Generated state parameter', { length: state.length, preview: state.substring(0, 10) + '...' });
    return state;
  }
}
