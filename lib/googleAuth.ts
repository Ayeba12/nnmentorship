import supabase from './supabase';

/**
 * Initiates the native Supabase Google OAuth sign-in flow.
 * Redirects the user to Google, which then redirects them back to the /dashboard callback.
 */
export async function signInWithGoogle() {
  if (typeof window === 'undefined') return;

  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });

    if (error) {
      console.error('Google OAuth initialization failed:', error.message);
    }
  } catch (err: any) {
    console.error('Error initiating Google OAuth:', err.message || err);
  }
}

/**
 * Deprecated: Legacy popup redirect handler. Left as noop for backwards compatibility.
 */
export async function handleGoogleRedirect() {
  // Noop: Supabase handles session establishment automatically on the callback redirect URL
}
