<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  /** @type {{ id:number, email:string, name:string } | null} */
  let user = null;
  let openCount = 0;

  async function refresh() {
    try {
      const [meRes, countRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/incidents/count')
      ]);
      user = meRes.ok ? await meRes.json() : null;
      openCount = countRes.ok ? (await countRes.json()).count ?? 0 : 0;
    } catch {}
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    await refresh();
    window.location.href = '/login';
  }

  onMount(refresh);
</script>

<header class="site-header">
  <div class="brand">
    <a href="/" aria-label="Portwarden AI home">Portwarden AI</a>
  </div>
  <nav class="nav" aria-label="Primary">
    <a href="/" class:active={$page.url.pathname === '/'}>Home</a>
    <a href="/incidents" class:active={$page.url.pathname === '/incidents'}>Incidents</a>
    <a href="/archive" class:active={$page.url.pathname === '/archive'}>Archive</a>
  </nav>
  <div class="status">
    <span class="pill" title="Open incidents">Open: {openCount}</span>
    {#if user}
      <span class="user" title={user.email}>
  <span class="avatar">{user.name?.split(' ').map((p)=>p[0]).join('').slice(0,2).toUpperCase()}</span>
        <span class="name">{user.name}</span>
      </span>
      <button class="link" on:click={logout}>Logout</button>
    {:else}
      <a class="link" href="/login">Login</a>
    {/if}
  </div>
</header>

<style>
  .site-header { 
    display: flex; 
    align-items: center; 
    justify-content: space-between; 
    gap: 2rem; 
    padding: 1.25rem 2rem; 
    background: rgba(15,23,42,0.85); 
    backdrop-filter: blur(10px);
    position: sticky; 
    top: 0; 
    z-index: 10; 
  }
  .brand a { 
    font-weight: 800; 
    letter-spacing: 0.02em; 
    font-size: 1.2rem;
    color: #f8fafc;
    text-decoration: none;
  }
  .nav { 
    display: flex; 
    gap: 2rem; 
  }
  .nav a { 
    color: #cbd5f5; 
    transition: all 0.2s ease; 
    padding: 0.5rem 0;
    font-weight: 500;
    position: relative;
    text-decoration: none;
  }
  .nav a:hover { 
    color: #f8fafc; 
    transform: translateY(-1px);
  }
  .nav a.active { 
    color: #60a5fa; 
    font-weight: 600; 
  }
  .nav a.active::after {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, #60a5fa, #3b82f6);
    border-radius: 1px;
  }
  .status { 
    display: flex; 
    align-items: center; 
    gap: 1rem; 
  }
  .pill { 
    background: rgba(59,130,246,0.18); 
    color: #bfdbfe; 
    border: 1px solid rgba(59,130,246,0.35); 
    padding: 0.25rem 0.75rem; 
    border-radius: 999px; 
    font-size: 0.85rem; 
    font-weight: 500;
  }
  .avatar { 
    display: inline-flex; 
    align-items: center; 
    justify-content: center; 
    width: 28px; 
    height: 28px; 
    border-radius: 50%; 
    background: #1f2937; 
    border: 1px solid rgba(148,163,184,0.3); 
    font-size: 0.8rem; 
    margin-right: 0.5rem; 
  }
  .name { 
    color: #e5e7eb; 
    font-weight: 500;
  }
  .link { 
    background: none; 
    color: #93c5fd; 
    border: none; 
    cursor: pointer; 
    padding: 0.5rem 0.75rem; 
    border-radius: 0.375rem;
    transition: all 0.2s ease;
    font-weight: 500;
    text-decoration: none;
    font-size: 0.9rem;
    min-height: 32px;
    display: inline-flex;
    align-items: center;
  }
  .link:hover {
    background: rgba(59,130,246,0.1);
    color: #bfdbfe;
  }

  /* Mobile Responsive Styles */
  @media (max-width: 768px) {
    .site-header {
      padding: 1rem;
      gap: 1rem;
    }
    
    .nav {
      gap: 1rem;
    }
    
    .nav a {
      font-size: 0.9rem;
      padding: 0.5rem 0.25rem;
    }
    
    .status {
      gap: 0.5rem;
    }
    
    .user {
      display: flex;
      align-items: center;
    }
    
    .name {
      display: none; /* Hide name on mobile to save space */
    }
    
    .link {
      font-size: 0.85rem;
      padding: 0.4rem 0.6rem;
      min-height: 28px;
    }
    
    .pill {
      font-size: 0.8rem;
      padding: 0.2rem 0.6rem;
    }
  }

  @media (max-width: 480px) {
    .site-header {
      padding: 0.75rem;
    }
    
    .brand a {
      font-size: 1.1rem;
    }
    
    .nav {
      gap: 0.75rem;
    }
    
    .nav a {
      font-size: 0.85rem;
      padding: 0.4rem 0.2rem;
    }
    
    .status {
      gap: 0.4rem;
    }
    
    .pill {
      font-size: 0.75rem;
      padding: 0.15rem 0.5rem;
    }
    
    .link {
      font-size: 0.8rem;
      padding: 0.35rem 0.5rem;
      min-height: 26px;
    }
    
    .avatar {
      width: 24px;
      height: 24px;
      font-size: 0.7rem;
      margin-right: 0;
    }
  }
</style>
