<script lang="ts">
	import { onMount, onDestroy } from 'svelte';

	let {
		onScanned,
		onCancel
	}: {
		onScanned: (code: string) => void;
		onCancel: () => void;
	} = $props();

	let videoEl: HTMLVideoElement | undefined = $state();
	let status = $state('Starting camera…');
	let hasError = $state(false);
	let codeReader: { reset: () => void } | null = null;

	onMount(async () => {
		if (!videoEl) return;

		try {
			const { BrowserMultiFormatReader } = await import('@zxing/library');
			codeReader = new BrowserMultiFormatReader() as unknown as { reset: () => void };

			status = 'Point at a barcode';

			await (codeReader as any).decodeFromConstraints(
				{
					video: {
						facingMode: 'environment',
						width: { ideal: 1280 },
						height: { ideal: 720 }
					}
				},
				videoEl,
				(result: { getText: () => string } | null, _err: unknown) => {
					if (result) {
						stop();
						onScanned(result.getText());
					}
					// _err fires on every frame without a code — ignore
				}
			);
		} catch (e: unknown) {
			hasError = true;
			const name = (e as { name?: string })?.name;
			if (name === 'NotAllowedError') {
				status = 'Camera access denied. Allow camera access in your browser settings and try again.';
			} else if (name === 'NotFoundError') {
				status = 'No camera found on this device.';
			} else {
				status = 'Could not start camera.';
			}
		}
	});

	function stop() {
		codeReader?.reset();
	}

	onDestroy(stop);

	function handleCancel() {
		stop();
		onCancel();
	}
</script>

<!-- Fullscreen camera overlay -->
<div class="fixed inset-0 z-50 bg-black flex flex-col">
	<!-- Header -->
	<div class="flex items-center justify-between px-4 py-3 bg-black/60">
		<p class="text-white font-medium text-sm">Scan barcode</p>
		<button
			onclick={handleCancel}
			class="text-white/80 hover:text-white p-1 rounded-full transition-colors"
			aria-label="Close scanner"
		>
			<svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
				<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
			</svg>
		</button>
	</div>

	{#if hasError}
		<div class="flex-1 flex items-center justify-center p-8">
			<div class="text-center space-y-4">
				<svg class="w-12 h-12 text-white/40 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
				</svg>
				<p class="text-white/70 text-sm max-w-xs">{status}</p>
				<button onclick={handleCancel} class="btn-secondary text-sm">Close</button>
			</div>
		</div>
	{:else}
		<!-- Camera feed -->
		<div class="flex-1 relative overflow-hidden">
			<!-- svelte-ignore a11y_media_has_caption -->
			<video bind:this={videoEl} class="w-full h-full object-cover" playsinline muted></video>

			<!-- Targeting overlay -->
			<div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
				<!-- Darken everything outside the guide box -->
				<div class="absolute inset-0 bg-black/40"></div>

				<!-- Guide box -->
				<div class="relative w-72 h-36 rounded-xl border-2 border-white/80 shadow-lg bg-transparent z-10">
					<!-- Corner accents -->
					<span class="absolute -top-0.5 -left-0.5 w-6 h-6 border-t-4 border-l-4 border-brand-400 rounded-tl-xl"></span>
					<span class="absolute -top-0.5 -right-0.5 w-6 h-6 border-t-4 border-r-4 border-brand-400 rounded-tr-xl"></span>
					<span class="absolute -bottom-0.5 -left-0.5 w-6 h-6 border-b-4 border-l-4 border-brand-400 rounded-bl-xl"></span>
					<span class="absolute -bottom-0.5 -right-0.5 w-6 h-6 border-b-4 border-r-4 border-brand-400 rounded-br-xl"></span>
				</div>
			</div>
		</div>

		<!-- Status -->
		<div class="bg-black/60 px-4 py-4 text-center">
			<p class="text-white/60 text-xs">{status}</p>
		</div>
	{/if}
</div>
