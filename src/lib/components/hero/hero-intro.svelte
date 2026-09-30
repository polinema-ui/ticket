<script lang="ts">
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import TechText from '@/lib/components/atoms/tech-text.svelte';
	import { Ticket02Icon, GitPullRequestIcon } from '@hugeicons/core-free-icons';
	import Button from '@/lib/components/ui/button/button.svelte';
</script>

<div class="mx-auto w-full max-w-7xl shrink-0 bg-white px-6 py-16 sm:p-28">
	<div class="mx-auto max-w-3xl text-center">
		<div class="flex w-full flex-col items-center gap-0" aria-hidden="true">
			<div class="h-15.5 w-full sm:h-17 lg:h-18">
				<TechText
					text="Biar Nggak Cuma"
					fontFamily="Plus Jakarta Sans"
					fontWeight={600}
					fontSize={56}
					letterSpacing={-0.04}
					color="#0a1a14"
					accentColor="#0a1a14"
					reveal="letter"
					dashLength={4}
					dashGap={2}
					strokeWidth={1.2}
					selection={true}
					labels={true}
					specks={0}
					draggable={true}
					sweep={false}
					speed={0.6}
				/>
			</div>
			<div class="-mt-1 h-15.5 w-full sm:h-17 lg:h-18">
				<TechText
					text="“Nanti dibenerin yach”"
					fontFamily="Plus Jakarta Sans"
					fontWeight={600}
					fontSize={56}
					letterSpacing={-0.04}
					color="#0a1a14"
					accentColor="#0a1a14"
					reveal="letter"
					dashLength={4}
					dashGap={2}
					strokeWidth={1.2}
					selection={true}
					labels={true}
					specks={0}
					draggable={true}
					sweep={false}
					speed={0.6}
				/>
			</div>
		</div>
		<h1 class="sr-only">Biar Nggak Cuma “Nanti Dibenerin”.</h1>
		<p class="text-md mx-auto mt-3 max-w-140 leading-5 text-zinc-500 sm:mt-3.5">
			Catat Request-nya, track progress-nya, terus gas sampai di merge.
		</p>

		<div class="mt-4 flex flex-col items-center justify-center gap-2.5 sm:mt-5 sm:flex-row">
			<Button variant="default" size="default" class="w-full sm:w-auto">
				<HugeiconsIcon icon={GitPullRequestIcon} size={16} />
				Buat Ticket
			</Button>
			<Button
				size="default"
				class="w-full border-gray-100 bg-white text-black shadow-none hover:bg-gray-100 sm:w-auto"
			>
				<HugeiconsIcon icon={Ticket02Icon} size={16} />
				Follow-up Ticket
			</Button>
		</div>
	</div>
</div>
