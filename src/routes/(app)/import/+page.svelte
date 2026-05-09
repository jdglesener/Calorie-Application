<script lang="ts">
	type ImportResult = { daysImported: number; entriesImported: number };

	let file = $state<File | null>(null);
	let importing = $state(false);
	let result = $state<ImportResult | null>(null);
	let importError = $state('');

	function handleFileChange(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		file = input.files?.[0] ?? null;
		result = null;
		importError = '';
	}

	async function handleImport() {
		if (!file) return;
		importing = true;
		importError = '';
		result = null;

		const body = new FormData();
		body.append('file', file);

		try {
			const res = await fetch('/api/import/myfitnesspal', { method: 'POST', body });
			const data = await res.json();
			if (!res.ok) {
				importError = data?.message ?? 'Import failed. Please check your file and try again.';
			} else {
				result = data as ImportResult;
			}
		} catch {
			importError = 'Network error. Please try again.';
		} finally {
			importing = false;
		}
	}
</script>

<div class="max-w-2xl mx-auto space-y-8">
	<div>
		<h1 class="text-2xl font-bold text-gray-900">Import from MyFitnessPal</h1>
		<p class="mt-1 text-sm text-gray-500">
			Import your food diary history from a MyFitnessPal data export.
		</p>
	</div>

	<!-- Instructions -->
	<div class="card">
		<div class="card-header">
			<h2 class="font-semibold text-gray-900">How to export from MyFitnessPal</h2>
		</div>
		<div class="card-body space-y-3 text-sm text-gray-700">
			<ol class="list-decimal list-inside space-y-2">
				<li>Open MyFitnessPal and go to <strong>My Home → Settings</strong></li>
				<li>Scroll to <strong>Export Data</strong> and click <strong>Request Data Export</strong></li>
				<li>Wait for the email from MyFitnessPal (usually arrives within a few minutes)</li>
				<li>Download the <strong>.zip</strong> file attached to the email</li>
				<li>Upload that ZIP file below</li>
			</ol>
			<p class="text-xs text-gray-400 pt-1">
				Only your food diary entries will be imported. Exercise, measurements, and notes are ignored.
				Existing entries on matching days will be kept — new entries are appended.
			</p>
		</div>
	</div>

	<!-- Upload form -->
	<div class="card">
		<div class="card-header">
			<h2 class="font-semibold text-gray-900">Upload ZIP file</h2>
		</div>
		<div class="card-body space-y-4">
			<div>
				<label for="zip-upload" class="label text-xs">MyFitnessPal export (.zip)</label>
				<input
					id="zip-upload"
					type="file"
					accept=".zip"
					onchange={handleFileChange}
					class="block w-full text-sm text-gray-700 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 cursor-pointer"
				/>
			</div>

			{#if importError}
				<p class="text-sm text-red-600">{importError}</p>
			{/if}

			{#if result}
				<div class="rounded-lg bg-green-50 border border-green-200 p-4">
					<p class="text-sm font-semibold text-green-800">Import complete</p>
					<p class="text-sm text-green-700 mt-1">
						{result.entriesImported} food entries imported across {result.daysImported} days.
					</p>
					<a href="/calories" class="text-sm text-green-700 underline mt-2 inline-block">
						View your calorie log →
					</a>
				</div>
			{/if}

			<div class="flex justify-end">
				<button
					type="button"
					onclick={handleImport}
					disabled={!file || importing}
					class="btn-primary"
				>
					{importing ? 'Importing…' : 'Import'}
				</button>
			</div>
		</div>
	</div>
</div>
