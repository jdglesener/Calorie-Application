<script lang="ts">
	type User = {
		id: string;
		name: string;
		displayName?: string | null;
		avatarUrl?: string | null;
	};

	let {
		user,
		variant,
		onRemove,
		onAccept,
		onDecline,
		onAdd,
		loading = false
	}: {
		user: User;
		variant: 'friend' | 'pending' | 'search-result';
		onRemove?: () => void;
		onAccept?: () => void;
		onDecline?: () => void;
		onAdd?: () => void;
		loading?: boolean;
	} = $props();

	const displayName = $derived(user.displayName ?? user.name);
	const initial = $derived(displayName.charAt(0).toUpperCase());
</script>

<div class="flex items-center gap-3 py-3 px-4 sm:px-5">
	<!-- Avatar -->
	{#if user.avatarUrl}
		<img src={user.avatarUrl} alt={displayName} class="h-10 w-10 rounded-full object-cover shrink-0" />
	{:else}
		<div class="h-10 w-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-semibold shrink-0">
			{initial}
		</div>
	{/if}

	<!-- Name -->
	<div class="flex-1 min-w-0">
		{#if variant === 'friend'}
			<a href="/friends/{user.id}" class="text-sm font-medium text-gray-900 hover:text-brand-600 truncate block">
				{displayName}
			</a>
		{:else}
			<p class="text-sm font-medium text-gray-900 truncate">{displayName}</p>
		{/if}
		{#if user.displayName}
			<p class="text-xs text-gray-400 truncate">@{user.name}</p>
		{/if}
	</div>

	<!-- Actions -->
	<div class="flex gap-2 shrink-0">
		{#if variant === 'friend'}
			<button onclick={onRemove} disabled={loading} class="btn-danger text-xs py-1 px-3">
				Remove
			</button>
		{:else if variant === 'pending'}
			<button onclick={onAccept} disabled={loading} class="btn-primary text-xs py-1 px-3">
				Accept
			</button>
			<button onclick={onDecline} disabled={loading} class="btn-secondary text-xs py-1 px-3">
				Decline
			</button>
		{:else if variant === 'search-result'}
			<button onclick={onAdd} disabled={loading || !onAdd} class="btn-primary text-xs py-1 px-3">
				{#if !onAdd}Sent{:else}Add Friend{/if}
			</button>
		{/if}
	</div>
</div>
