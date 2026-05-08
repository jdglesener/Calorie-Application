<script lang="ts">
	import { page } from '$app/stores';
	import type { User } from 'better-auth';

	let { user }: { user: User | null } = $props();

	const navItems = [
		{ href: '/dashboard', label: 'Dashboard' },
		{ href: '/calories', label: 'Calories' },
		{ href: '/challenges', label: 'Challenges' },
		{ href: '/friends', label: 'Friends' },
		{ href: '/profile', label: 'Profile' }
	];
</script>

<!-- Desktop sidebar -->
<aside class="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col border-r border-gray-200 bg-white">
	<div class="flex h-16 items-center px-6 border-b border-gray-200">
		<a href="/dashboard" class="flex items-center gap-2">
			<span class="text-xl font-bold text-brand-600">Discipline</span>
		</a>
	</div>

	<nav class="flex-1 px-4 py-6 space-y-1">
		{#each navItems as item}
			{@const active = $page.url.pathname.startsWith(item.href)}
			<a
				href={item.href}
				class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors {active ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}"
			>
				{#if item.label === 'Dashboard'}
					<svg class="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
					</svg>
				{:else if item.label === 'Calories'}
					<svg class="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
					</svg>
				{:else if item.label === 'Challenges'}
					<svg class="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
					</svg>
				{:else if item.label === 'Friends'}
					<svg class="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
					</svg>
				{:else}
					<svg class="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
					</svg>
				{/if}
				{item.label}
			</a>
		{/each}
	</nav>

	<div class="border-t border-gray-200 p-4">
		<div class="flex items-center gap-3 mb-3">
			<div class="h-8 w-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-semibold text-sm">
				{user?.name?.charAt(0).toUpperCase() ?? '?'}
			</div>
			<div class="flex-1 min-w-0">
				<p class="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
				<p class="text-xs text-gray-400 truncate">{user?.email}</p>
			</div>
		</div>
		<form method="POST" action="/logout">
			<button type="submit" class="btn-secondary w-full text-xs py-1.5">Sign out</button>
		</form>
	</div>
</aside>
