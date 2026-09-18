/**
 * Real Google Identity Services (GIS) OAuth 2.0 Auth Service
 * Uses Google's official accounts.google.com SDK with ID token credentials.
 */

export const DEFAULT_GOOGLE_CLIENT_ID = 
  import.meta.env.VITE_GOOGLE_CLIENT_ID || 
  '1005301953165-6crod6p1tt7m2h2qck0km5s6ibjj9mmd.apps.googleusercontent.com';

export const realGoogleAuthService = {
  getClientId() {
    return localStorage.getItem('dothis_custom_google_client_id') || DEFAULT_GOOGLE_CLIENT_ID;
  },

  setClientId(clientId) {
    if (clientId) {
      localStorage.setItem('dothis_custom_google_client_id', clientId.trim());
    } else {
      localStorage.removeItem('dothis_custom_google_client_id');
    }
  },

  /**
   * Initializes Google Identity Services SDK using standard credential / ID-token flow.
   */
  initGoogleIdServices(onSuccessCallback) {
    if (typeof window === 'undefined' || !window.google || !window.google.accounts || !window.google.accounts.id) {
      return false;
    }

    const clientId = this.getClientId();

    try {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => {
          if (response && response.credential) {
            // Pass real Google-signed ID token to caller for server-side verification
            onSuccessCallback({
              idToken: response.credential,
              credential: response.credential
            });
          }
        },
        auto_select: false,
        cancel_on_tap_outside: true
      });
      return true;
    } catch (e) {
      console.warn('Google Identity Services init warning:', e);
      return false;
    }
  },

  /**
   * Render official Google Sign-In Button in container element
   */
  renderOfficialGoogleButton(containerElement, onSuccessCallback) {
    if (!containerElement) return false;
    const initialized = this.initGoogleIdServices(onSuccessCallback);
    if (initialized && window.google && window.google.accounts && window.google.accounts.id) {
      try {
        containerElement.innerHTML = '';
        window.google.accounts.id.renderButton(containerElement, {
          theme: 'outline',
          size: 'large',
          type: 'standard',
          shape: 'pill',
          text: 'signin_with',
          logo_alignment: 'left',
          width: 300
        });
        return true;
      } catch (e) {
        console.warn('Google Render Button failover error:', e);
        return false;
      }
    }
    return false;
  },

  /**
   * Prompt Google One-Tap or ID Token dialog if supported
   */
  promptOneTap(onSuccessCallback) {
    const initialized = this.initGoogleIdServices(onSuccessCallback);
    if (initialized && window.google && window.google.accounts && window.google.accounts.id) {
      try {
        window.google.accounts.id.prompt();
      } catch (e) {
        console.warn('Google One Tap prompt warning:', e);
      }
    }
  }
};
