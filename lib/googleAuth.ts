import supabase from './supabase';

const isMobile = () => typeof window !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

function buildGoogleUrl(appName: string) {
  if (typeof window === 'undefined') return null;
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const redirectUri = process.env.NEXT_PUBLIC_GOOGLE_AUTH_PROXY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!clientId || !redirectUri) return null;
  const state = btoa(JSON.stringify({ origin: window.location.origin, appName, supabaseUrl, supabaseAnonKey }));
  return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=openid%20email%20profile&prompt=select_account&state=${encodeURIComponent(state)}`;
}

export function signInWithGoogle(appName = 'Nigerian Navy Mentorship') {
  if (typeof window === 'undefined') return;
  const url = buildGoogleUrl(appName);
  if (!url) { console.warn('Google auth not configured'); return; }

  window.open(url, 'google-auth', isMobile() ? '' : 'width=500,height=600');

  const handler = async (event: MessageEvent) => {
    if (event.data?.type === 'google-auth-denied') {
      window.removeEventListener('message', handler);
      return;
    }
    if (event.data?.type !== 'google-auth-success') return;
    window.removeEventListener('message', handler);
    if (event.data.access_token && event.data.refresh_token) {
      const { error } = await supabase.auth.setSession({
        access_token: event.data.access_token,
        refresh_token: event.data.refresh_token,
      });
      if (error) console.error('Google auth failed:', error.message);
    } else if (event.data.id_token) {
      const { error } = await supabase.auth.signInWithIdToken({ provider: 'google', token: event.data.id_token });
      if (error) console.error('Google auth failed:', error.message);
    }
  };
  window.addEventListener('message', handler);
}

export async function handleGoogleRedirect() {
  if (typeof window === 'undefined') return;
  const params = new URLSearchParams(window.location.search);
  const token = params.get('google_id_token');
  if (!token) return;
  window.history.replaceState({}, '', window.location.pathname);
  const { error } = await supabase.auth.signInWithIdToken({ provider: 'google', token });
  if (error) { console.error('Google redirect auth failed:', error.message); return; }
  try { window.close(); } catch { /* noop */ }
}
