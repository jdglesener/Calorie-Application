<script lang="ts">
	let { children }: { children: any } = $props();
</script>

<div class="min-h-screen bg-gradient-to-br from-brand-50 to-brand-100 flex items-center justify-center p-4">
	<div class="w-full max-w-md">
		<div class="text-center mb-8">
			<h1 class="text-3xl font-bold text-brand-700">Discipline</h1>
			<p class="text-gray-500 mt-1 text-sm">Build better habits, together.</p>
		</div>
		<div class="card">
			<div class="card-body">
				{@render children()}
			</div>
		</div>
	</div>
</div>
