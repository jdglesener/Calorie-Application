<script lang="ts">
	import { authClient } from '$lib/auth-client';
	import { goto } from '$app/navigation';

	let email = $state('');
	let password = $state('');
	let error = $state('');
	let loading = $state(false);

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		error = '';
		loading = true;

		const { error: authError } = await authClient.signIn.email({
			email,
			password,
			callbackURL: '/dashboard'
		});

		if (authError) {
			error = authError.message ?? 'Invalid email or password.';
			loading = false;
		} else {
			await goto('/dashboard');
		}
	}
</script>

<svelte:head>
	<title>Sign In — Discipline</title>
</svelte:head>

<h2 class="text-xl font-semibold text-gray-900 mb-6">Sign in to your account</h2>

{#if error}
	<div class="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
		{error}
	</div>
{/if}

<form onsubmit={handleSubmit} class="space-y-4">
	<div>
		<label for="email" class="label">Email</label>
		<input
			id="email"
			type="email"
			autocomplete="email"
			required
			bind:value={email}
			class="input"
			placeholder="you@example.com"
		/>
	</div>
	<div>
		<label for="password" class="label">Password</label>
		<input
			id="password"
			type="password"
			autocomplete="current-password"
			required
			bind:value={password}
			class="input"
			placeholder="••••••••"
		/>
	</div>
	<button type="submit" class="btn-primary w-full" disabled={loading}>
		{loading ? 'Signing in…' : 'Sign in'}
	</button>
</form>

<p class="mt-6 text-center text-sm text-gray-500">
	Don't have an account?
	<a href="/register" class="font-medium text-brand-600 hover:text-brand-700">Register</a>
</p>
