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
			openCount = countRes.ok ? ((await countRes.json()).count ?? 0) : 0;
		} catch {}
	}

	async function logout() {
		await fetch('/api/auth/logout', { method: 'POST' });
		await refresh();
		window.location.href = '/login';
	}

	onMount(refresh);
</script>

<header class="site-header" data-elevated>
	<div class="brand">
		<a href="/" class="brand-mark" aria-hidden="true">PW</a>
		<a href="/" class="brand-title" aria-label="Portwarden AI home">Portwarden AI</a>
	</div>
	<nav class="nav" aria-label="Primary">
		<a href="/" class:active={$page.url.pathname === '/'}>Home</a>
		<a href="/incidents" class:active={$page.url.pathname === '/incidents'}>Incidents</a>
		<a href="/archive" class:active={$page.url.pathname === '/archive'}>Archive</a>
	</nav>
	<div class="status">
		<span class="pill" title="Open incidents">
			<span class="pill-indicator" aria-hidden="true"></span>
			Open {openCount}
		</span>
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
			<a class="link" href="/login">Login</a>
		{/if}
	</div>
</header>

<style>
	.site-header {
		position: sticky;
		top: 0;
		z-index: 20;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 2rem;
		padding: 1.1rem clamp(1.25rem, 3vw, 2.5rem);
		background: linear-gradient(90deg, rgba(15, 23, 42, 0.88) 0%, rgba(15, 23, 42, 0.72) 100%);
		border-bottom: 1px solid rgba(148, 163, 184, 0.18);
		box-shadow: 0 1px 0 rgba(148, 163, 184, 0.12);
		backdrop-filter: blur(14px);
		-webkit-backdrop-filter: blur(14px);
	}

	.brand {
		display: flex;
		align-items: center;
		gap: 0.85rem;
	}

	.brand-mark {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 38px;
		height: 38px;
		border-radius: 0.9rem;
		background: linear-gradient(135deg, rgba(37, 99, 235, 0.65), rgba(124, 58, 237, 0.7));
		color: #fff;
		font-weight: 700;
		letter-spacing: 0.08em;
		border: 1px solid rgba(96, 165, 250, 0.45);
		text-decoration: none;
	}

	.brand-title {
		font-size: 1.15rem;
		font-weight: 700;
		letter-spacing: 0.04em;
		color: var(--pw-text-primary);
	}

	.nav {
		display: flex;
		gap: clamp(1rem, 3vw, 2rem);
	}

	.nav a {
		position: relative;
		color: var(--pw-text-secondary);
		font-weight: 500;
		letter-spacing: 0.02em;
		padding: 0.35rem 0;
		transition: color 0.2s ease;
	}

	.nav a:hover {
		color: #e2e8f0;
	}

	.nav a.active {
		color: var(--pw-accent);
	}

	.nav a.active::after {
		content: '';
		position: absolute;
		left: 0;
		right: 0;
		bottom: -0.4rem;
		height: 2px;
		border-radius: 999px;
		background: linear-gradient(90deg, rgba(96, 165, 250, 0.8), rgba(59, 130, 246, 0.9));
	}

	.status {
		display: flex;
		align-items: center;
		gap: 0.85rem;
	}

	.pill {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.35rem 0.9rem;
		border-radius: 999px;
		background: rgba(96, 165, 250, 0.16);
		border: 1px solid rgba(96, 165, 250, 0.45);
		color: #dbeafe;
		font-size: 0.85rem;
		font-weight: 500;
	}

	.pill-indicator {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--pw-success);
		box-shadow: 0 0 0 6px rgba(34, 197, 94, 0.18);
	}

	.avatar {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		border-radius: 50%;
		background: rgba(15, 23, 42, 0.65);
		border: 1px solid rgba(148, 163, 184, 0.4);
		font-size: 0.82rem;
		font-weight: 600;
	}

	.name {
		color: var(--pw-text-primary);
		font-weight: 500;
	}

	.link {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0.45rem 0.9rem;
		border-radius: 0.8rem;
		border: 1px solid rgba(148, 163, 184, 0.32);
		background: rgba(15, 23, 42, 0.55);
		color: #bfdbfe;
		font-size: 0.85rem;
		font-weight: 500;
		transition: all 0.2s ease;
	}

	.link:hover {
		border-color: rgba(148, 163, 184, 0.6);
		color: #e0f2fe;
	}

	@media (max-width: 900px) {
		.site-header {
			padding: 0.95rem 1.4rem;
			gap: 1.4rem;
		}

		.brand-title {
			font-size: 1.05rem;
		}

		.nav {
			gap: 1.2rem;
		}

		.status {
			gap: 0.6rem;
		}

		.name {
			display: none;
		}
	}

	@media (max-width: 620px) {
		.site-header {
			flex-wrap: wrap;
			gap: 0.75rem;
		}

		.nav {
			order: 3;
			width: 100%;
			justify-content: space-between;
		}

		.status {
			order: 2;
			width: 100%;
			justify-content: flex-end;
		}

		.pill {
			font-size: 0.75rem;
			padding: 0.3rem 0.75rem;
		}

		.link {
			font-size: 0.8rem;
			padding: 0.4rem 0.75rem;
		}
	}
</style>
