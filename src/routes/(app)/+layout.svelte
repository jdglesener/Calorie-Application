<script lang="ts">
	import Navbar from '$lib/components/layout/Navbar.svelte';
	import MobileNav from '$lib/components/layout/MobileNav.svelte';
	import type { LayoutData } from './$types';

	let { data, children }: { data: LayoutData; children: any } = $props();
</script>

<div class="min-h-screen bg-gray-50">
	<!-- Desktop sidebar / top nav -->
	<Navbar user={data.user} />

	<main class="pb-20 md:pb-0 md:pl-64">
		<div class="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
			{@render children()}
		</div>
	</main>

	<!-- Mobile bottom nav -->
	<MobileNav />
</div>
