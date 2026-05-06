<script lang="ts">
	import { page } from '$app/stores';

	const navItems = [
		{ href: '/dashboard', label: 'Home', icon: '🏠' },
		{ href: '/calories', label: 'Calories', icon: '🍎' },
		{ href: '/challenges', label: 'Challenges', icon: '🏆' },
		{ href: '/friends', label: 'Friends', icon: '👥' },
		{ href: '/profile', label: 'Profile', icon: '⚙️' }
	];
</script>

<nav class="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 z-50">
	<div class="flex">
		{#each navItems as item}
			<a
				href={item.href}
				class="flex-1 flex flex-col items-center gap-0.5 py-2 text-xs font-medium transition-colors
					{$page.url.pathname.startsWith(item.href)
					? 'text-brand-600'
					: 'text-gray-500 hover:text-gray-700'}"
			>
				<span class="text-lg leading-none">{item.icon}</span>
				{item.label}
			</a>
		{/each}
	</div>
</nav>
