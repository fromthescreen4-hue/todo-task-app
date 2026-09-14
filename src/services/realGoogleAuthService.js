/**
 * Real Google Identity Services (GIS) OAuth 2.0 Auth Service
 * Uses Google's official accounts.google.com SDK.
 */

// User's Google OAuth 2.0 Client ID
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
   * Decodes JWT ID token returned directly by accounts.google.com
   */
  decodeGoogleJwt(token) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      console.error('Failed to decode Google JWT token:', e);
      return null;
    }
  },

  /**
   * Initializes Google Identity Services SDK
   */
  initGoogleIdServices(onSuccessCallback) {
    if (typeof window === 'undefined' || !window.google || !window.google.accounts) {
      return false;
    }

    const clientId = this.getClientId();

    try {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => {
          if (response.credential) {
            const payload = this.decodeGoogleJwt(response.credential);
            if (payload) {
              const googleProfile = {
                googleId: payload.sub,
                email: payload.email,
                name: payload.name || payload.given_name || payload.email.split('@')[0],
                avatar: payload.picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${payload.email}`,
                idToken: response.credential,
                googleCalendarConnected: true
              };
              onSuccessCallback(googleProfile);
            }
          }
        },
        auto_select: false
      });
      return true;
    } catch (e) {
      console.warn('Google Identity Services init warning:', e);
      return false;
    }
  },

  /**
   * Render official Google Sign In Button in container element
   */
  renderOfficialGoogleButton(containerElement, onSuccessCallback) {
    if (!containerElement) return;
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
          width: 320
        });
      } catch (e) {
        console.warn('Google Render Button failover:', e);
      }
    }
  },

  /**
   * Trigger Google OAuth2 Token Authorization using Google Identity Services (GIS) initTokenClient
   * GIS initTokenClient uses postMessage popup auth to eliminate redirect_uri_mismatch errors.
   */
  openRealGoogleOAuthWindow(onSuccessCallback, onErrorCallback) {
    const clientId = this.getClientId();

    // Check if official GIS SDK is loaded
    if (typeof window !== 'undefined' && window.google && window.google.accounts && window.google.accounts.oauth2) {
      try {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: 'email profile https://www.googleapis.com/auth/calendar.events',
          callback: (tokenResponse) => {
            if (tokenResponse && tokenResponse.access_token) {
              // Fetch user info from Google API using access token
              fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
              })
                .then(res => res.json())
                .then(userinfo => {
                  if (userinfo && userinfo.email) {
                    onSuccessCallback({
                      googleId: userinfo.sub || `google_${Date.now()}`,
                      email: userinfo.email,
                      name: userinfo.name || userinfo.given_name || userinfo.email.split('@')[0],
                      avatar: userinfo.picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userinfo.email}`,
                      accessToken: tokenResponse.access_token,
                      googleCalendarConnected: true
                    });
                  } else {
                    if (onErrorCallback) onErrorCallback('Could not fetch user profile from Google.');
                  }
                })
                .catch(err => {
                  if (onErrorCallback) onErrorCallback(err.message || 'Google userinfo request failed.');
                });
            } else {
              if (onErrorCallback) onErrorCallback('Google Sign-In popup closed or permission denied.');
            }
          },
          error_callback: (err) => {
            console.warn('GIS TokenClient error:', err);
            if (onErrorCallback) onErrorCallback('Google Identity Services authorization failed.');
          }
        });

        client.requestAccessToken();
        return;
      } catch (e) {
        console.warn('GIS TokenClient init warning:', e);
      }
    }

    // Direct Window Fallback Popup
    const redirectUri = window.location.origin;
    const scope = encodeURIComponent('email profile https://www.googleapis.com/auth/calendar.events');
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=token&client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&prompt=select_account`;

    const width = 500;
    const height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
      authUrl,
      'GoogleAccountSignIn',
      `width=${width},height=${height},top=${top},left=${left},scrollbars=yes`
    );

    const checkTimer = setInterval(() => {
      try {
        if (!popup || popup.closed) {
          clearInterval(checkTimer);
          return;
        }

        if (popup.location && popup.location.href.includes(redirectUri)) {
          const hash = popup.location.hash;
          popup.close();
          clearInterval(checkTimer);

          if (hash.includes('access_token')) {
            const params = new URLSearchParams(hash.substring(1));
            const accessToken = params.get('access_token');

            fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${accessToken}` }
            })
              .then(res => res.json())
              .then(userinfo => {
                if (userinfo && userinfo.email) {
                  onSuccessCallback({
                    googleId: userinfo.sub || `google_${Date.now()}`,
                    email: userinfo.email,
                    name: userinfo.name || userinfo.email.split('@')[0],
                    avatar: userinfo.picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userinfo.email}`,
                    accessToken,
                    googleCalendarConnected: true
                  });
                }
              })
              .catch(err => {
                if (onErrorCallback) onErrorCallback('Failed to retrieve user profile.');
              });
          }
        }
      } catch (e) {
        // Cross-origin check while popup navigates on Google domains
      }
    }, 500);
  }
};
