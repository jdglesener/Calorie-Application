<script lang="ts">
	type LeaderboardEntry = {
		rank: number;
		user: { id: string; name: string; displayName?: string | null; avatarUrl?: string | null };
		totalMetricValue: number;
		daysParticipated: number;
	};

	let {
		leaderboard,
		challengeType,
		currentUserId
	}: {
		leaderboard: LeaderboardEntry[];
		challengeType: string;
		currentUserId: string;
	} = $props();

	const valueLabel: Record<string, string> = {
		CALORIE_LIMIT: 'cal',
		CALORIE_GOAL: 'cal',
		STEP_GOAL: 'steps',
		EXERCISE_MINUTES: 'min',
		CUSTOM: ''
	};

	const unit = $derived(valueLabel[challengeType] ?? '');
</script>

{#if leaderboard.length === 0}
	<div class="card card-body text-center py-8">
		<p class="text-gray-400 text-sm">No entries yet — log food to start appearing on the leaderboard.</p>
	</div>
{:else}
	<div class="card overflow-hidden">
		<div class="card-header">
			<h3 class="font-semibold text-gray-900">Leaderboard</h3>
		</div>
		<ul class="divide-y divide-gray-100">
			{#each leaderboard as entry}
				{@const isCurrentUser = entry.user.id === currentUserId}
				{@const displayName = entry.user.displayName ?? entry.user.name}
				{@const initial = displayName.charAt(0).toUpperCase()}
				<li class="flex items-center gap-3 px-4 sm:px-5 py-3 {isCurrentUser ? 'bg-brand-50' : ''}">
					<!-- Rank -->
					<div class="w-8 text-center shrink-0">
						{#if entry.rank === 1}
							<span class="text-lg">🏆</span>
						{:else}
							<span class="text-sm font-semibold text-gray-500">#{entry.rank}</span>
						{/if}
					</div>

					<!-- Avatar -->
					{#if entry.user.avatarUrl}
						<img src={entry.user.avatarUrl} alt={displayName} class="h-8 w-8 rounded-full object-cover shrink-0" />
					{:else}
						<div class="h-8 w-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-semibold text-sm shrink-0">
							{initial}
						</div>
					{/if}

					<!-- Name -->
					<div class="flex-1 min-w-0">
						<p class="text-sm font-medium text-gray-900 truncate {isCurrentUser ? 'text-brand-700' : ''}">
							{displayName}{isCurrentUser ? ' (you)' : ''}
						</p>
						<p class="text-xs text-gray-400">{entry.daysParticipated} day{entry.daysParticipated !== 1 ? 's' : ''}</p>
					</div>

					<!-- Value -->
					<div class="text-right shrink-0">
						<p class="text-sm font-semibold text-gray-900">
							{entry.totalMetricValue.toLocaleString()}{unit ? ' ' + unit : ''}
						</p>
						<p class="text-xs text-gray-400">total</p>
					</div>
				</li>
			{/each}
		</ul>
	</div>
{/if}
