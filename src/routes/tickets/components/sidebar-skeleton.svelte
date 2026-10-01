<div class="space-y-6 lg:col-span-1 animate-pulse">
	<div class="rounded-xl border border-zinc-200 bg-white p-4 shadow-2xs">
		<div class="flex items-center gap-2 border-b border-zinc-100 pb-3">
			<div class="h-4 w-4 rounded-full bg-zinc-200"></div>
			<div class="h-3 w-16 rounded bg-zinc-200"></div>
		</div>
		<div class="mt-4 space-y-3">
			{#each Array(5) as _}
				<div class="flex items-center justify-between">
					<div class="h-6 w-24 rounded-full bg-zinc-100"></div>
					<div class="h-3 w-4 rounded bg-zinc-100"></div>
				</div>
			{/each}
		</div>
	</div>

	<div class="rounded-xl border border-zinc-200 bg-white p-4 shadow-2xs">
		<div class="flex items-center gap-2 border-b border-zinc-100 pb-3">
			<div class="h-4 w-4 rounded-full bg-zinc-200"></div>
			<div class="h-3 w-20 rounded bg-zinc-200"></div>
		</div>
		<div class="mt-4 space-y-3">
			{#each Array(3) as _}
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-2">
						<div class="h-5 w-5 rounded-full bg-zinc-200"></div>
						<div class="h-3 w-20 rounded bg-zinc-100"></div>
					</div>
					<div class="h-3 w-4 rounded bg-zinc-100"></div>
				</div>
			{/each}
		</div>
		<div class="mt-4 border-t border-zinc-100 pt-3">
			<div class="h-3 w-32 rounded bg-zinc-200"></div>
		</div>
	</div>
</div>