<script>
  import { onMount } from 'svelte';
  let mode = 'login';
  let email = '';
  let password = '';
  let name = '';
  let toast = '';
  let loading = false;

  async function submit() {
    toast = '';
    if (!email || !password || (mode === 'register' && !name)) {
      toast = 'Please fill in all required fields.';
      return;
    }
    loading = true;
    try {
      const endpoint = mode === 'register' ? '/api/auth/register' : '/api/auth/login';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mode === 'register' ? { email, password, name } : { email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Authentication failed');
      window.location.href = '/';
    } catch (e) {
      toast = e instanceof Error ? e.message : 'Authentication error';
    } finally {
      loading = false;
    }
  }
</script>

<!-- Maritime-themed background -->
<div class="auth-background">
  <div class="overlay"></div>
</div>

<main class="auth-container">
  <div class="auth-card">
    <div class="auth-header">
      <h1 class="auth-title">
        {#if mode === 'login'}
          Welcome Back
        {:else}
          Join Portwarden
        {/if}
      </h1>
      <p class="auth-subtitle">
        {#if mode === 'login'}
          Sign in to access your maritime operations dashboard
        {:else}
          Create your account to get started with intelligent maritime oversight
        {/if}
      </p>
    </div>

    {#if toast}
      <div class="toast">{toast}</div>
    {/if}

    <form class="auth-form" on:submit|preventDefault={submit}>
      {#if mode === 'register'}
        <div class="input-group">
          <label for="name">Full Name</label>
          <input 
            id="name"
            type="text" 
            bind:value={name} 
            autocomplete="name"
            placeholder="Enter your full name"
            required
          />
        </div>
      {/if}
      
      <div class="input-group">
        <label for="email">Email Address</label>
        <input 
          id="email"
          type="email" 
          bind:value={email} 
          autocomplete="email"
          placeholder="Enter your email address"
          required
        />
      </div>
      
      <div class="input-group">
        <label for="password">Password</label>
        <input 
          id="password"
          type="password" 
          bind:value={password} 
          autocomplete="current-password"
          placeholder="Enter your password"
          required
        />
      </div>

      <button type="submit" class="auth-button" disabled={loading}>
        {#if loading}
          <div class="spinner"></div>
          <span>Processing...</span>
        {:else}
          <span>{mode === 'login' ? 'Sign In' : 'Create Account'}</span>
          <svg class="button-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        {/if}
      </button>
    </form>

    <div class="auth-toggle">
      {#if mode === 'login'}
        <p>Don't have an account? 
          <button class="toggle-link" on:click={() => (mode = 'register')}>
            Create one here
          </button>
        </p>
      {:else}
        <p>Already have an account? 
          <button class="toggle-link" on:click={() => (mode = 'login')}>
            Sign in instead
          </button>
        </p>
      {/if}
    </div>

    <div class="auth-footer">
      <p>Secure maritime operations platform</p>
    </div>
  </div>
</main>

<style>
  :global(body) {
    margin: 0;
    font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    background: #0a0f1c;
    color: #f8fafc;
    overflow-x: hidden;
  }

  .auth-background {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url('/images/wideangle.jpg') center/cover no-repeat;
    z-index: 1;
  }

  .overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      135deg,
      rgba(10, 15, 28, 0.85) 0%,
      rgba(30, 41, 59, 0.75) 50%,
      rgba(15, 23, 42, 0.9) 100%
    );
    backdrop-filter: blur(8px);
  }

  .auth-container {
    position: relative;
    z-index: 2;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
  }

  .auth-card {
    width: 100%;
    max-width: 480px;
    background: linear-gradient(145deg, rgba(15, 23, 42, 0.9), rgba(30, 41, 59, 0.8));
    border: 1px solid rgba(148, 163, 184, 0.2);
    border-radius: 2rem;
    padding: 3rem;
    backdrop-filter: blur(20px);
    box-shadow: 
      0 25px 50px -12px rgba(0, 0, 0, 0.5),
      0 0 0 1px rgba(96, 165, 250, 0.1);
    animation: slideUp 0.6s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
  }

  .auth-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #60a5fa, #34d399, #fbbf24);
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .auth-header {
    text-align: center;
    margin-bottom: 2.5rem;
  }

  .auth-title {
    font-size: 2.5rem;
    font-weight: 800;
    margin: 0 0 1rem;
    background: linear-gradient(135deg, #60a5fa, #34d399);
    background-clip: text;
    -webkit-background-clip: text;
    color: transparent;
    text-shadow: 0 0 40px rgba(96, 165, 250, 0.3);
    letter-spacing: -0.02em;
  }

  .auth-subtitle {
    font-size: 1.1rem;
    color: #94a3b8;
    margin: 0;
    line-height: 1.6;
    font-weight: 400;
  }

  .toast {
    padding: 1rem 1.25rem;
    border-radius: 1rem;
    background: linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(220, 38, 38, 0.15));
    border: 1px solid rgba(248, 113, 113, 0.3);
    color: #fecaca;
    margin-bottom: 1.5rem;
    font-weight: 500;
    animation: fadeIn 0.3s ease;
    box-shadow: 0 10px 25px -10px rgba(239, 68, 68, 0.2);
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .auth-form {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    margin-bottom: 2rem;
  }

  .input-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .input-group label {
    font-size: 0.95rem;
    font-weight: 600;
    color: #e2e8f0;
    letter-spacing: 0.02em;
  }

  .input-group input {
    padding: 1rem 1.25rem;
    border-radius: 1rem;
    border: 1px solid rgba(148, 163, 184, 0.25);
    background: rgba(15, 23, 42, 0.8);
    color: #f8fafc;
    font-size: 1rem;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    backdrop-filter: blur(10px);
  }

  .input-group input:focus {
    outline: none;
    border-color: #60a5fa;
    background: rgba(15, 23, 42, 0.95);
    box-shadow: 
      0 0 0 3px rgba(96, 165, 250, 0.1),
      0 10px 25px -10px rgba(96, 165, 250, 0.2);
    transform: translateY(-2px);
  }

  .input-group input::placeholder {
    color: #64748b;
  }

  .auth-button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    padding: 1.25rem 2rem;
    border-radius: 1rem;
    border: none;
    background: linear-gradient(135deg, #60a5fa, #3b82f6);
    color: white;
    font-size: 1.1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
    margin-top: 0.5rem;
  }

  .auth-button::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.5s ease;
  }

  .auth-button:hover::before {
    left: 100%;
  }

  .auth-button:hover {
    transform: translateY(-3px);
    box-shadow: 
      0 20px 40px -15px rgba(59, 130, 246, 0.4),
      0 0 0 1px rgba(96, 165, 250, 0.3);
    background: linear-gradient(135deg, #3b82f6, #2563eb);
  }

  .auth-button:active {
    transform: translateY(-1px);
  }

  .auth-button:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
  }

  .auth-button:disabled:hover {
    transform: none;
    box-shadow: none;
  }

  .spinner {
    width: 20px;
    height: 20px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top: 2px solid white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .button-arrow {
    width: 20px;
    height: 20px;
    transition: transform 0.3s ease;
  }

  .auth-button:hover .button-arrow {
    transform: translateX(4px);
  }

  .auth-toggle {
    text-align: center;
    padding: 1.5rem 0;
    border-top: 1px solid rgba(148, 163, 184, 0.2);
    margin-top: 1rem;
  }

  .auth-toggle p {
    margin: 0;
    color: #94a3b8;
    font-size: 0.95rem;
  }

  .toggle-link {
    background: none;
    border: none;
    color: #60a5fa;
    cursor: pointer;
    font-weight: 600;
    font-size: inherit;
    transition: all 0.3s ease;
    text-decoration: underline;
    text-decoration-color: transparent;
    text-underline-offset: 4px;
  }

  .toggle-link:hover {
    color: #34d399;
    text-decoration-color: #34d399;
    transform: translateY(-1px);
  }

  .auth-footer {
    text-align: center;
    margin-top: 1.5rem;
    padding-top: 1.5rem;
    border-top: 1px solid rgba(148, 163, 184, 0.1);
  }

  .auth-footer p {
    margin: 0;
    color: #64748b;
    font-size: 0.85rem;
    font-weight: 500;
  }

  /* Mobile Responsive */
  @media (max-width: 640px) {
    .auth-container {
      padding: 1rem;
    }

    .auth-card {
      padding: 2rem;
      border-radius: 1.5rem;
    }

    .auth-title {
      font-size: 2rem;
    }

    .auth-subtitle {
      font-size: 1rem;
    }

    .input-group input {
      padding: 0.875rem 1rem;
    }

    .auth-button {
      padding: 1rem 1.5rem;
      font-size: 1rem;
    }
  }

  /* Accessibility */
  @media (prefers-reduced-motion: reduce) {
    .auth-card,
    .toast,
    .input-group input,
    .auth-button,
    .toggle-link {
      animation: none;
      transition: none;
    }

    .spinner {
      animation: none;
    }
  }
</style>
