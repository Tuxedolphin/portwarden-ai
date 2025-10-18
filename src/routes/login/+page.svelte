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

<main class="auth">
  <h1>{mode === 'login' ? 'Login' : 'Register'}</h1>
  {#if toast}
    <div class="toast">{toast}</div>
  {/if}
  <form on:submit|preventDefault={submit}>
    {#if mode === 'register'}
      <label>
        <span>Name</span>
        <input type="text" bind:value={name} autocomplete="name" />
      </label>
    {/if}
    <label>
      <span>Email</span>
      <input type="email" bind:value={email} autocomplete="email" />
    </label>
    <label>
      <span>Password</span>
      <input type="password" bind:value={password} autocomplete="current-password" />
    </label>
    <button type="submit" disabled={loading}>{loading ? 'Please wait…' : (mode === 'login' ? 'Login' : 'Create account')}</button>
  </form>
  <p class="toggle">
    {#if mode === 'login'}
      No account? <button class="link" on:click={() => (mode = 'register')}>Register</button>
    {:else}
      Have an account? <button class="link" on:click={() => (mode = 'login')}>Login</button>
    {/if}
  </p>
</main>

<style>
  .auth { max-width: 420px; margin: 3rem auto; padding: 1.25rem; background: rgba(15,23,42,0.65); border: 1px solid rgba(148,163,184,0.2); border-radius: 12px; }
  h1 { margin: 0 0 1rem; }
  form { display: flex; flex-direction: column; gap: 0.75rem; }
  label { display: flex; flex-direction: column; gap: 0.35rem; }
  input { padding: 0.6rem 0.75rem; border-radius: 8px; border: 1px solid rgba(148,163,184,0.25); background: rgba(15,23,42,0.9); color: #e2e8f0; }
  button { padding: 0.65rem 1.2rem; border-radius: 8px; border: none; background: linear-gradient(135deg, #2563eb, #3b82f6); color: #fff; font-weight: 600; cursor: pointer; }
  .toast { padding: 0.5rem 0.75rem; border-radius: 8px; background: rgba(239,68,68,0.2); border: 1px solid rgba(248,113,113,0.35); color: #fecaca; margin-bottom: 0.5rem; }
  .toggle { margin-top: 0.75rem; color: #94a3b8; }
  /* link buttons styled above */
</style>
