<script>
  import { signInWithGoogle, logout, auth } from '$lib/firebase';
  import { onAuthStateChanged } from 'firebase/auth';
  import { fade } from 'svelte/transition';
  import { onMount } from 'svelte';
  import Quiz from '../components/Quiz.svelte';

  // ===== AUTH STATE =====
  let user = null;
  let loading = true;
  let authError = null;
  let isSigningIn = false;

  // ===== LIFECYCLE =====
  onMount(async () => {
    try {
      await logout(); // Clear any existing session
    } catch (error) {
      console.log("No active session to clear");
    }
  });

  // ===== AUTH LISTENER =====
  onAuthStateChanged(auth, 
    (currentUser) => {
      user = currentUser;
      loading = false;
      isSigningIn = false;
      authError = null;
    }, 
    (error) => {
      authError = error.message;
      loading = false;
      isSigningIn = false;
    }
  );

  // ===== AUTH ACTIONS =====
  const handleGoogleSignIn = async () => {
    if (isSigningIn) return;
    isSigningIn = true;
    authError = null;
    try {
      await signInWithGoogle();
    } catch (error) {
      authError = error.code === 'auth/popup-blocked' 
        ? 'Please allow popups to sign in' 
        : error.message;
      isSigningIn = false;
    }
  };
</script>

<!-- ===== MAIN APP ===== -->
<div class="min-h-screen bg-gradient-to-br from-black to-gray-900 flex items-center justify-center p-4">
  {#if loading}
    <!-- Loading Overlay -->
    <div class="fixed inset-0 bg-black/95 flex items-center justify-center z-50">
      <div class="flex flex-col items-center space-y-8">
        <div class="relative w-24 h-24">
          <div class="absolute inset-0 rounded-full border-4 border-transparent border-t-violet-600 border-r-violet-600 animate-spin"></div>
          <div class="absolute inset-2 rounded-full border-4 border-transparent border-b-violet-400 border-l-violet-400 animate-spin-reverse"></div>
          <div class="absolute inset-4 rounded-full border-4 border-transparent border-t-violet-300 border-r-violet-300 animate-spin-slow"></div>
        </div>
        <div class="text-center space-y-2">
          <p class="text-white font-medium text-lg">Preparing your quiz experience</p>
          <p class="text-gray-400 text-sm">Just a moment...</p>
        </div>
      </div>
    </div>
  
  {:else if user}
    <!-- Authenticated State -->
    <Quiz />
  
  {:else if isSigningIn}
    <!-- Signing In State -->
    <div class="fixed inset-0 bg-black/95 flex items-center justify-center z-50">
      <div class="flex flex-col items-center space-y-8">
        <div class="flex space-x-3">
          {#each { length: 5 } as _, i}
            <div 
              class="w-4 h-4 bg-violet-600 rounded-full animate-pulse" 
              style={`animation-delay: ${i * 0.1}s`}
            ></div>
          {/each}
        </div>
        <div class="text-center space-y-2">
          <p class="text-white font-medium text-lg">Connecting to Google</p>
          <p class="text-gray-400 text-sm">Please wait...</p>
        </div>
      </div>
    </div>
  
  {:else}
    <!-- Login Form -->
    <div 
      class="bg-gradient-to-br from-gray-900 to-black border border-gray-900 rounded-2xl p-8 w-full max-w-md shadow-2xl backdrop-blur-sm"
      in:fade
    >
      <div class="text-center mb-8">
        <h1 class="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-violet-600 mb-2">QUIZ APP</h1>
        <p class="text-gray-400 mb-1">Test your knowledge</p>
        <p class="text-gray-600 text-sm">Challenge yourself with questions</p>
      </div>

      {#if authError}
        <div class="mb-6 p-3 bg-red-900/30 text-red-300 rounded-lg border border-red-700/50 text-sm backdrop-blur-sm">
          {authError}
        </div>
      {/if}

      <button
        on:click={handleGoogleSignIn}
        class="w-full group relative bg-black hover:bg-black/90 text-white font-medium py-3.5 px-6 rounded-xl 
               transition-all duration-300 border border-black flex items-center justify-center
               hover:border-violet-500 hover:shadow-lg hover:shadow-violet-500/20 active:scale-[0.98]"
      >
        <span class="absolute inset-0 bg-gradient-to-r from-violet-600/20 to-transparent opacity-0 
                     group-hover:opacity-100 transition-opacity duration-300"></span>
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-3" viewBox="0 0 24 24" fill="currentColor">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        <span class="relative z-10">Sign in with Google</span>
      </button>

      <div class="mt-6 text-center">
        <a
          href="https://www.linkedin.com/in/samarthmuktamath"
          target="_blank"
          class="inline-flex items-center justify-center gap-1 text-sm text-gray-400 hover:text-violet-400 transition"
        >
          <span>Let's make it two-way→</span>
          <span>Quiz Me Back</span>
        </a>
      </div>
    </div>
  {/if}
</div>

<style>
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  @keyframes spin-reverse {
    to { transform: rotate(-360deg); }
  }
  @keyframes spin-slow {
    to { transform: rotate(720deg); }
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(0.9); }
  }
  
  .animate-spin { animation: spin 3s linear infinite; }
  .animate-spin-reverse { animation: spin-reverse 4s linear infinite; }
  .animate-spin-slow { animation: spin-slow 6s linear infinite; }
  .animate-pulse { animation: pulse 1.5s infinite ease-in-out; }
</style>