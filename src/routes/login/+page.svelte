<script>
	const differentiators = [
		{
			title: '24/7 observability',
			description:
				'Command the port from anywhere with continuous telemetry, anomaly alerts and AI briefings.'
		},
		{
			title: 'Enterprise security',
			description:
				'All sessions protected with Argon2 hashing, granular roles and compliant audit logging.'
		},
		{
			title: 'Faster incident cycles',
			description:
				'Codify playbooks, share context instantly and resolve maritime disruptions in minutes.'
		}
	];

	const headings = {
		login: 'Welcome back, captain',
		register: 'Create your command center'
	};

	const actions = {
		login: 'Sign in to dashboard',
		register: 'Create secure account'
	};

	const description = {
		login: 'Log in to orchestrate real-time port operations, AI co-pilots and incident workflows.',
		register:
			'Provision your Portwarden AI workspace and onboard your first responders in under a minute.'
	};

	let mode = 'login';
	let email = '';
	let password = '';
	let name = '';
	let toast = '';
	let loading = false;
	let passwordVisible = false;

	function toggleMode(nextMode) {
		if (mode === nextMode) return;
		mode = nextMode;
		toast = '';
	}

	async function submit() {
		toast = '';
		if (!email || !password || (mode === 'register' && !name)) {
			toast = 'Please complete all required fields.';
			return;
		}

		loading = true;
		try {
			const endpoint = mode === 'register' ? '/api/auth/register' : '/api/auth/login';
			const payload = mode === 'register' ? { email, password, name } : { email, password };
			const res = await fetch(endpoint, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});
			const data = await res.json();
			if (!res.ok) {
				throw new Error(data?.error || 'Unable to authenticate');
			}
			window.location.href = '/';
		} catch (e) {
			toast = e instanceof Error ? e.message : 'Authentication error';
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Portwarden AI • {mode === 'login' ? 'Login' : 'Register'}</title>
</svelte:head>

<main class="auth-shell">
	<section class="auth-panel surface-card">
		<div class="panel-head">
			<span class="badge">Secure access</span>
			<h1>{headings[mode]}</h1>
			<p class="lede">{description[mode]}</p>
		</div>

		<div class="mode-toggle" role="tablist" aria-label="Authentication mode">
			<button
				type="button"
				role="tab"
				class:active={mode === 'login'}
				aria-selected={mode === 'login'}
				on:click={() => toggleMode('login')}
			>
				Sign in
			</button>
			<button
				type="button"
				role="tab"
				class:active={mode === 'register'}
				aria-selected={mode === 'register'}
				on:click={() => toggleMode('register')}
			>
				Register
			</button>
		</div>

		{#if toast}
			<div class="toast" role="alert">{toast}</div>
		{/if}

		<form class="auth-form" on:submit|preventDefault={submit} aria-live="polite">
			{#if mode === 'register'}
				<label>
					<span>Full name</span>
					<input
						type="text"
						placeholder="Captain Jane Doe"
						bind:value={name}
						autocomplete="name"
						required={mode === 'register'}
					/>
				</label>
			{/if}
			<label>
				<span>Email address</span>
				<input
					type="email"
					placeholder="you@harbor.gov"
					bind:value={email}
					autocomplete="email"
					required
				/>
			</label>
			<label>
				<span>Password</span>
				<div class="password-field">
					<input
						type={passwordVisible ? 'text' : 'password'}
						placeholder="••••••••"
						bind:value={password}
						autocomplete={mode === 'login' ? 'current-password' : 'new-password'}
						required
					/>
					<button
						type="button"
						class="password-toggle"
						on:click={() => (passwordVisible = !passwordVisible)}
					>
						{passwordVisible ? 'Hide' : 'Show'}
					</button>
				</div>
			</label>

			<button class="submit" type="submit" disabled={loading}>
				{#if loading}
					<span class="spinner" aria-hidden="true"></span>
					Verifying…
				{:else}
					{actions[mode]}
				{/if}
			</button>
		</form>

		<p class="help-text">
			{#if mode === 'login'}
				Need an account? <button type="button" on:click={() => toggleMode('register')}
					>Create one</button
				>
			{:else}
				Already onboard? <button type="button" on:click={() => toggleMode('login')}>Sign in</button>
			{/if}
		</p>
	</section>

	<aside class="brand-panel surface-muted" aria-label="Portwarden AI advantages">
		<div class="panel-overlay"></div>
		<div class="panel-content">
			<h2>Operate with maritime certainty</h2>
			<p>
				Portwarden AI unifies sensors, logistics data and AI copilots so your harbor teams respond
				as one.
			</p>

			<ul class="benefits">
				{#each differentiators as item}
					<li>
						<span class="marker" aria-hidden="true"></span>
						<div>
							<h3>{item.title}</h3>
							<p>{item.description}</p>
						</div>
					</li>
				{/each}
			</ul>

			<div class="compliance">
				<span class="badge">SOC2 ready</span>
				<span class="badge">Encrypted at rest</span>
				<span class="badge">Audit trails</span>
			</div>
		</div>
	</aside>
</main>

<style>
	.auth-shell {
		display: grid;
		gap: clamp(1.5rem, 4vw, 3rem);
		grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
		align-items: stretch;
		padding: clamp(2.5rem, 6vw, 5rem) clamp(1.25rem, 5vw, 4rem);
		min-height: calc(100vh - 80px);
	}

	.auth-panel {
		position: relative;
		z-index: 1;
		display: flex;
		flex-direction: column;
		gap: 1.75rem;
	}

	.panel-head h1 {
		margin: 0.5rem 0 0;
		font-size: clamp(2rem, 3.5vw, 2.8rem);
		letter-spacing: -0.02em;
	}

	.lede {
		margin: 0.5rem 0 0;
		color: var(--pw-text-secondary);
		max-width: 38ch;
	}

	.mode-toggle {
		display: inline-flex;
		align-items: center;
		background: rgba(15, 23, 42, 0.65);
		border-radius: 12px;
		border: 1px solid rgba(148, 163, 184, 0.35);
		padding: 0.35rem;
		gap: 0.35rem;
		width: fit-content;
	}

	.mode-toggle button {
		border: none;
		background: transparent;
		color: var(--pw-text-secondary);
		font-weight: 500;
		padding: 0.6rem 1.3rem;
		border-radius: 10px;
		transition:
			background 0.2s ease,
			color 0.2s ease;
	}

	.mode-toggle button.active {
		background: linear-gradient(135deg, rgba(37, 99, 235, 0.85), rgba(124, 58, 237, 0.9));
		color: #fff;
		box-shadow: 0 16px 32px rgba(37, 99, 235, 0.25);
	}

	.toast {
		border-radius: 12px;
		padding: 0.75rem 1rem;
		background: rgba(248, 113, 113, 0.18);
		border: 1px solid rgba(248, 113, 113, 0.4);
		color: #fecaca;
		font-weight: 500;
	}

	.auth-form {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	label {
		display: flex;
		flex-direction: column;
		gap: 0.55rem;
		color: var(--pw-text-secondary);
		font-size: 0.95rem;
	}

	input {
		width: 100%;
		border-radius: 12px;
		border: 1px solid rgba(148, 163, 184, 0.28);
		background: rgba(15, 23, 42, 0.7);
		color: var(--pw-text-primary);
		padding: 0.75rem 1rem;
		transition:
			border-color 0.2s ease,
			background 0.2s ease;
	}

	input:focus {
		border-color: rgba(96, 165, 250, 0.7);
		background: rgba(15, 23, 42, 0.85);
	}

	.password-field {
		position: relative;
		display: flex;
		align-items: center;
	}

	.password-field input {
		padding-right: 4.5rem;
	}

	.password-toggle {
		position: absolute;
		right: 0.6rem;
		border: none;
		background: transparent;
		color: #bfdbfe;
		font-size: 0.85rem;
	}

	.password-toggle:hover {
		color: #e0f2fe;
	}

	.submit {
		border: none;
		border-radius: 14px;
		padding: 0.85rem 1.6rem;
		font-weight: 600;
		font-size: 1rem;
		background: linear-gradient(135deg, #2563eb, #7c3aed);
		color: #fff;
		box-shadow: 0 20px 45px rgba(59, 130, 246, 0.28);
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.65rem;
		transition:
			transform 0.2s ease,
			box-shadow 0.2s ease,
			opacity 0.2s ease;
	}

	.submit:hover:not(:disabled) {
		transform: translateY(-1px);
		box-shadow: 0 24px 60px rgba(59, 130, 246, 0.32);
	}

	.submit:disabled {
		opacity: 0.75;
		cursor: progress;
	}

	.spinner {
		width: 18px;
		height: 18px;
		border-radius: 50%;
		border: 2px solid rgba(255, 255, 255, 0.4);
		border-top-color: #fff;
		animation: rotate 0.8s linear infinite;
	}

	.help-text {
		color: var(--pw-text-muted);
		font-size: 0.9rem;
		margin: 0;
	}

	.help-text button {
		border: none;
		background: none;
		color: #e0f2fe;
		font-weight: 500;
	}

	.help-text button:hover {
		text-decoration: underline;
	}

	.brand-panel {
		position: relative;
		overflow: hidden;
		padding: clamp(2rem, 4vw, 3rem);
	}

	.panel-overlay {
		position: absolute;
		inset: -20%;
		background:
			radial-gradient(circle at 30% 20%, rgba(59, 130, 246, 0.3), transparent 55%),
			radial-gradient(circle at 70% 80%, rgba(124, 58, 237, 0.28), transparent 60%);
		filter: blur(60px);
		opacity: 0.7;
		pointer-events: none;
	}

	.panel-content {
		position: relative;
		z-index: 1;
		display: flex;
		flex-direction: column;
		gap: 1.8rem;
	}

	.panel-content h2 {
		margin: 0;
		font-size: clamp(1.8rem, 3vw, 2.4rem);
	}

	.panel-content p {
		margin: 0;
		color: var(--pw-text-secondary);
		max-width: 46ch;
	}

	.benefits {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 1.25rem;
	}

	.benefits li {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 1rem;
		align-items: flex-start;
	}

	.benefits h3 {
		margin: 0 0 0.25rem;
		font-size: 1.1rem;
	}

	.benefits p {
		color: var(--pw-text-muted);
		margin: 0;
	}

	.marker {
		width: 14px;
		height: 14px;
		border-radius: 50%;
		background: linear-gradient(135deg, #2563eb, #38bdf8);
		box-shadow: 0 0 0 6px rgba(37, 99, 235, 0.18);
	}

	.compliance {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
	}

	@keyframes rotate {
		to {
			transform: rotate(1turn);
		}
	}

	@media (max-width: 900px) {
		.auth-shell {
			padding-top: 2.75rem;
		}

		.brand-panel {
			order: -1;
		}
	}

	@media (max-width: 540px) {
		.auth-shell {
			padding: 2rem 1.15rem 3rem;
		}

		.mode-toggle {
			width: 100%;
			justify-content: space-between;
		}

		.mode-toggle button {
			flex: 1;
			text-align: center;
		}
	}
</style>
