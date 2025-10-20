<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import ThemeToggle from './ThemeToggle.svelte';

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
			openCount = countRes.ok ? ((await countRes.json()).count ?? 0) : 0;
		} catch {}
	}

	async function logout() {
		await fetch('/api/auth/logout', { method: 'POST' });
		await refresh();
		window.location.href = '/';
	}

	onMount(refresh);
</script>

<header class="site-header">
	<div class="brand">
		<a href={user ? '/incidents' : '/'} aria-label="Portwarden AI home">Portwarden AI</a>
	</div>
	<nav class="nav" aria-label="Primary">
		{#if user}
			<a href="/incidents" class:active={$page.url.pathname.startsWith('/incidents')}>Incidents</a>
			<a href="/archive" class:active={$page.url.pathname.startsWith('/archive')}>Archive</a>
		{:else}
			<a href="/" class:active={$page.url.pathname === '/'}>Home</a>
			<a href="/demo" class:active={$page.url.pathname.startsWith('/demo')}>Demo</a>
		{/if}
	</nav>
	<div class="status">
		<ThemeToggle size="sm" />
		{#if user}
			<span class="user" title={user.email}>
				<span class="avatar"
					>{user.name
						?.split(' ')
						.map((p) => p[0])
						.join('')
						.slice(0, 2)
						.toUpperCase()}</span
				>
				<span class="name">{user.name}</span>
			</span>
			<button class="link" on:click={logout}>Logout</button>
		{:else}
			<a class="link" href="/login">Sign In</a>
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
		background: rgba(15, 23, 42, 0.85);
		backdrop-filter: var(--maritime-blur, blur(10px));
		position: sticky;
		top: 0;
		z-index: 10;
		transition: var(--maritime-transition);
		border-bottom: 1px solid var(--maritime-border-light);
	}

	:global(html.light) .site-header {
		background: rgba(248, 250, 252, 0.85);
		border-bottom: 1px solid var(--maritime-border);
	}

	.brand a {
		font-weight: 800;
		letter-spacing: 0.02em;
		font-size: 1.2rem;
		color: var(--maritime-text-primary);
		text-decoration: none;
		transition: color 0.3s ease;
	}

	/* Force light theme colors */
	:global(html.light) .brand a {
		color: #0f172a !important;
	}

	.nav {
		display: flex;
		gap: 2rem;
	}
	.nav a {
		color: var(--maritime-text-secondary);
		transition: all 0.2s ease;
		padding: 0.5rem 0;
		font-weight: 500;
		position: relative;
		text-decoration: none;
	}

	/* Force light theme colors for nav */
	:global(html.light) .nav a {
		color: #1e293b !important;
	}
	.nav a:hover {
		color: var(--maritime-text-primary);
		transform: translateY(-1px);
	}

	/* Force light theme hover colors */
	:global(html.light) .nav a:hover {
		color: #0f172a !important;
	}

	.nav a.active {
		color: var(--maritime-accent);
		font-weight: 600;
	}

	/* Force light theme active colors */
	:global(html.light) .nav a.active {
		color: #3b82f6 !important;
	}
	/* Additional strong theme enforcement */
	:global(html.light) .site-header .brand a {
		color: #0f172a !important;
	}

	:global(html.light) .site-header .nav a {
		color: #1e293b !important;
	}

	:global(html.light) .site-header .nav a:hover {
		color: #0f172a !important;
	}

	:global(html.light) .site-header .nav a.active {
		color: #3b82f6 !important;
	}

	:global(html.light) .site-header .name {
		color: #1e293b !important;
	}

	.nav a.active::after {
		content: '';
		position: absolute;
		bottom: -2px;
		left: 0;
		right: 0;
		height: 2px;
		background: linear-gradient(
			90deg,
			var(--maritime-accent, #60a5fa),
			var(--maritime-accent-secondary, #3b82f6)
		);
		border-radius: 1px;
		transition: var(--maritime-transition);
	}
	.status {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.avatar {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		border-radius: 50%;
		background: var(--maritime-bg-tertiary, #1f2937);
		border: 1px solid rgba(148, 163, 184, 0.3);
		font-size: 0.8rem;
		margin-right: 0.5rem;
		transition: background-color 0.3s ease;
	}

	:global(html.light) .avatar {
		background: var(--maritime-bg-secondary, #f1f5f9);
		color: var(--maritime-text-primary, #0f172a);
	}

	.name {
		color: var(--maritime-text-secondary, #e5e7eb);
		font-weight: 500;
		transition: color 0.3s ease;
	}

	/* Force light theme name color */
	:global(html.light) .name {
		color: #1e293b !important;
	}
	.link {
		background: none;
		color: var(--maritime-accent, #93c5fd);
		border: none;
		cursor: pointer;
		transition: color 0.3s ease;
		padding: 0.5rem 0.75rem;
		border-radius: 0.375rem;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		font-weight: 500;
		text-decoration: none;
		font-size: 0.9rem;
		min-height: 32px;
		display: inline-flex;
		align-items: center;
		position: relative;
		overflow: hidden;
	}

	.link:hover {
		background: rgba(59, 130, 246, 0.1);
		color: var(--maritime-accent-light, #bfdbfe);
		transform: translateY(-1px);
	}

	/* Special styling for login link when user is not authenticated */
	.link[href='/login'] {
		background: linear-gradient(135deg, #60a5fa, #3b82f6);
		color: var(--maritime-text-primary, white);
		font-weight: 600;
		padding: 0.75rem 1.5rem;
		border-radius: 0.75rem;
		border: 1px solid rgba(96, 165, 250, 0.3);
		box-shadow: 0 4px 15px -4px rgba(59, 130, 246, 0.25);
		transition: color 0.3s ease;
	}

	/* Login button should stay white on blue background in both themes */
	.link[href='/login'] {
		color: white !important;
	}

	.link[href='/login']::before {
		content: '';
		position: absolute;
		top: 0;
		left: -100%;
		width: 100%;
		height: 100%;
		background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
		transition: left 0.5s ease;
	}

	.link[href='/login']:hover::before {
		left: 100%;
	}

	.link[href='/login']:hover {
		background: linear-gradient(135deg, #3b82f6, #2563eb);
		color: white !important;
		transform: translateY(-2px);
		box-shadow: 0 8px 25px -8px rgba(59, 130, 246, 0.4);
		transition: color 0.3s ease;
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
