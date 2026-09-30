<script lang="ts">
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import usBg from '@/lib/assets/us.webp';
	import { GithubIcon, GitPullRequestIcon, MoreHorizontalIcon } from '@hugeicons/core-free-icons';
	import { GRID_COLS, GRID_ROWS, HERO_CARDS } from '@/lib/data/hero-cards.js';
</script>

<div class="-mt-3.5 w-full shrink-0">
	<div
		class="relative h-50 w-full overflow-hidden border-x-0 border-y border-zinc-900/10 bg-zinc-900 sm:h-75 lg:h-130"
	>
		<img src={usBg} alt="Background" class="absolute inset-0 h-full w-full object-cover" />
		<div class="absolute inset-0 bg-black/10"></div>

		<div class="relative grid h-full min-h-0 w-full grid-cols-10 grid-rows-3">
			{#each Array(GRID_ROWS).keys() as r (r)}
				{#each Array(GRID_COLS).keys() as c (`${r}-${c}`)}
					{@const card = HERO_CARDS.find((x) => x.col === c && x.row === r)}
					{#if card}
						<div
							class="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white p-2.5 shadow-sm sm:rounded-xl"
						>
							<div class="flex items-center gap-1 text-[9px] leading-none">
								<HugeiconsIcon icon={GithubIcon} size={12} color="#111827" class="shrink-0" />
								<span class="font-medium text-zinc-500">#{card.prNumber}</span>
								{#if card.status === 'Open'}
									<span
										class="inline-flex items-center gap-0.5 rounded-full bg-[#dcfce7] px-1.5 py-0.5 text-[8px] leading-none font-semibold text-[#15803d]"
									>
										<HugeiconsIcon icon={GitPullRequestIcon} size={9} color="#15803d" />
										Open
									</span>
								{:else if card.status === 'Merged'}
									<span
										class="inline-flex items-center gap-0.5 rounded-full bg-[#f3e8ff] px-1.5 py-0.5 text-[8px] leading-none font-semibold text-[#7e22ce]"
									>
										<HugeiconsIcon icon={GitPullRequestIcon} size={9} color="#7e22ce" />
										Merged
									</span>
								{:else if card.status === 'Draft'}
									<span
										class="inline-flex items-center gap-0.5 rounded-full bg-zinc-100 px-1.5 py-0.5 text-[8px] leading-none font-semibold text-zinc-500"
									>
										<HugeiconsIcon icon={GitPullRequestIcon} size={9} color="#71717a" />
										Draft
									</span>
								{:else}
									<span
										class="inline-flex items-center gap-0.5 rounded-full bg-red-50 px-1.5 py-0.5 text-[8px] leading-none font-semibold text-red-600"
									>
										<HugeiconsIcon icon={GitPullRequestIcon} size={9} color="#dc2626" />
										{card.status}
									</span>
								{/if}
								<span class="ml-auto hidden text-zinc-300 sm:block">
									<HugeiconsIcon icon={MoreHorizontalIcon} size={10} color="#d4d4d8" />
								</span>
							</div>

							<p
								class="mt-1.5 line-clamp-2 text-[10px] leading-tight font-semibold text-zinc-900 sm:text-[10.5px]"
							>
								{card.title.replace('\n', ' ')}
							</p>

							<p class="mt-1 line-clamp-2 text-[8.5px] leading-[1.4] text-zinc-500 sm:text-[9px]">
								{card.description}
							</p>

							<div class="mt-auto flex items-center gap-1 pt-1.5">
								<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
								<a
									href={card.authorUrl}
									target="_blank"
									rel="noopener noreferrer"
									class="flex shrink-0 items-center gap-1 hover:opacity-80"
								>
									<img
										src={card.avatarUrl}
										alt={card.author}
										class="h-4 w-4 shrink-0 rounded-full bg-zinc-200 object-cover ring-1 ring-zinc-200"
										loading="lazy"
									/>
									<span
										class="max-w-18 min-w-0 truncate text-[8.5px] leading-none font-medium text-zinc-600"
										>{card.author}</span
									>
								</a>
								<span class="hidden text-[8px] leading-none text-zinc-400 sm:inline"
									>· {card.timeAgo}</span
								>
								<span
									class="ml-1 flex shrink-0 items-center gap-0.5 text-[8.5px] leading-none font-semibold"
								>
									<span class="text-emerald-600">+{card.additions}</span>
									<span class="text-zinc-300">/</span>
									<span class="text-red-500">-{card.deletions}</span>
								</span>
							</div>

							<div class="mt-1.5 flex flex-wrap gap-1">
								{#each card.labels as label (label)}
									<span
										class="rounded-full bg-[#ede9fe] px-1.5 py-0.5 text-[8px] leading-none font-medium text-[#6d28d9] sm:px-2"
										>{label}</span
									>
								{/each}
							</div>
						</div>
					{:else}
						<div
							class="h-full min-h-0 w-full rounded-lg border border-white/[0.14] bg-black/5 backdrop-blur-[0.5px] sm:rounded-xl"
						></div>
					{/if}
				{/each}
			{/each}
		</div>
	</div>
</div>
