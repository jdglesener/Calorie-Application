<script lang="ts">
	import { page } from '$app/stores';
	import type { User } from 'better-auth';

	let { user }: { user: User | null } = $props();

	const navItems = [
		{ href: '/dashboard', label: 'Dashboard', icon: '🏠' },
		{ href: '/calories', label: 'Calories', icon: '🍎' },
		{ href: '/challenges', label: 'Challenges', icon: '🏆' },
		{ href: '/friends', label: 'Friends', icon: '👥' },
		{ href: '/profile', label: 'Profile', icon: '⚙️' }
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
			<a
				href={item.href}
				class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors
					{$page.url.pathname.startsWith(item.href)
					? 'bg-brand-50 text-brand-700'
					: 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}"
			>
				<span class="text-base">{item.icon}</span>
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
