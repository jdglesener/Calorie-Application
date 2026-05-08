<script lang="ts">
	import { authClient } from '$lib/auth-client';
	import { goto } from '$app/navigation';

	let name = $state('');
	let email = $state('');
	let password = $state('');
	let error = $state('');
	let loading = $state(false);

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		error = '';

		if (password.length < 8) {
			error = 'Password must be at least 8 characters.';
			return;
		}

		loading = true;

		const { error: authError } = await authClient.signUp.email({
			name,
			email,
			password,
			callbackURL: '/dashboard'
		});

		if (authError) {
			error = authError.message ?? 'Registration failed.';
			loading = false;
		} else {
			await goto('/dashboard');
		}
	}
</script>

<svelte:head>
	<title>Create Account — Discipline</title>
</svelte:head>

<h2 class="text-xl font-semibold text-gray-900 mb-6">Create your account</h2>

{#if error}
	<div class="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
		{error}
	</div>
{/if}

<form onsubmit={handleSubmit} class="space-y-4">
	<div>
		<label for="name" class="label">Full Name</label>
		<input
			id="name"
			type="text"
			autocomplete="name"
			required
			bind:value={name}
			class="input"
			placeholder="Jordan Smith"
		/>
	</div>
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
			autocomplete="new-password"
			required
			minlength="8"
			bind:value={password}
			class="input"
			placeholder="Min. 8 characters"
		/>
	</div>
	<button type="submit" class="btn-primary w-full" disabled={loading}>
		{loading ? 'Creating account…' : 'Create account'}
	</button>
</form>

<p class="mt-6 text-center text-sm text-gray-500">
	Already have an account?
	<a href="/login" class="font-medium text-brand-600 hover:text-brand-700">Sign in</a>
</p>
