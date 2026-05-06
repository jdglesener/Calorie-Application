<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
	let loading = $state(false);
</script>

<svelte:head>
	<title>Create Account — Discipline</title>
</svelte:head>

<h2 class="text-xl font-semibold text-gray-900 mb-6">Create your account</h2>

{#if form?.error}
	<div class="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
		{form.error}
	</div>
{/if}

<form
	method="POST"
	use:enhance={() => {
		loading = true;
		return async ({ update }) => {
			loading = false;
			await update();
		};
	}}
	class="space-y-4"
>
	<div>
		<label for="name" class="label">Full Name</label>
		<input
			id="name"
			name="name"
			type="text"
			autocomplete="name"
			required
			class="input"
			placeholder="Jordan Smith"
		/>
	</div>
	<div>
		<label for="email" class="label">Email</label>
		<input
			id="email"
			name="email"
			type="email"
			autocomplete="email"
			required
			class="input"
			placeholder="you@example.com"
		/>
	</div>
	<div>
		<label for="password" class="label">Password</label>
		<input
			id="password"
			name="password"
			type="password"
			autocomplete="new-password"
			required
			minlength="8"
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
