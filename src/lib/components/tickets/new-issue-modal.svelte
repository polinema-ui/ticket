<script lang="ts">
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import {
		Cancel01Icon,
		ArrowRight01Icon,
		Shield01Icon,
		ArrowUpRight01Icon,
		GitPullRequestIcon,
		CheckmarkCircle02Icon
	} from '@hugeicons/core-free-icons';
	import Button from '@/lib/components/ui/button/button.svelte';
	import type { IssueTemplate } from '@/lib/types/ticket.js';
	import {
		DEFAULT_TEMPLATES,
		BUG_REPORT_TEMPLATE,
		COMPONENT_REQUEST_TEMPLATE,
		DOCS_ISSUE_TEMPLATE,
		buildGithubIssueUrl
	} from '@/lib/data/issue-templates.js';

	let {
		isOpen = $bindable(false),
		templates = DEFAULT_TEMPLATES,
		activeRepo = 'p-ui'
	}: {
		isOpen: boolean;
		templates?: IssueTemplate[];
		activeRepo?: string;
	} = $props();

	let selectedTemplate = $state<IssueTemplate | null>(null);
	let title = $state('');
	let email = $state('');
	let description = $state('');
	let label = $state('bug');
	let isSubmitting = $state(false);
	let isSuccess = $state(false);

	let githubDirectUrl = $derived(buildGithubIssueUrl(activeRepo, title, description, label));

	const handleSelect = (tmpl: IssueTemplate) => {
		if (tmpl.targetUrl) {
			window.open(tmpl.targetUrl, '_blank', 'noopener,noreferrer');
			isOpen = false;
			return;
		}

		let defaultTitle = '[BUG] ';
		let bodyContent = BUG_REPORT_TEMPLATE;
		let defaultLabel = 'bug';

		if (tmpl.id === 'component') {
			defaultTitle = '[COMPONENT] ';
			bodyContent = COMPONENT_REQUEST_TEMPLATE;
			defaultLabel = 'component';
		} else if (tmpl.id === 'docs') {
			defaultTitle = '[DOCS] ';
			bodyContent = DOCS_ISSUE_TEMPLATE;
			defaultLabel = 'documentation';
		}

		const directUrl = buildGithubIssueUrl(activeRepo, defaultTitle, bodyContent, defaultLabel);
		window.open(directUrl, '_blank', 'noopener,noreferrer');
		isOpen = false;
	};

	const handleSubmit = async (e: SubmitEvent) => {
		e.preventDefault();
		if (!title.trim() || !email.trim() || !description.trim()) return;

		isSubmitting = true;
		try {
			const res = await fetch('/api/notify/issue', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					title: title.trim(),
					body: description.trim(),
					reporterEmail: email.trim(),
					repo: activeRepo,
					author: 'web-visitor'
				})
			});
			if (!res.ok) throw new Error('Notify failed');
			isSuccess = true;
			setTimeout(() => {
				isSuccess = false;
				selectedTemplate = null;
				isOpen = false;
				title = '';
				email = '';
				description = '';
				label = 'bug';
			}, 1400);
		} catch {
			isSuccess = false;
		} finally {
			isSubmitting = false;
		}
	};

	const close = () => {
		isOpen = false;
		selectedTemplate = null;
		isSuccess = false;
	};
</script>

{#if isOpen}
	<div class="fixed inset-0 z-9999 flex items-center justify-center p-4">
		<button
			type="button"
			class="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
			onclick={close}
			aria-label="Close modal"
		></button>

		<div
			class="relative w-full max-w-xl overflow-hidden rounded-2xl border border-zinc-200 bg-white text-zinc-900 shadow-2xl"
		>
			<div
				class="flex items-center justify-between border-b border-zinc-100 bg-zinc-50/70 px-5 py-3.5"
			>
				<div class="flex items-center gap-2">
					<h3 class="text-sm font-bold tracking-tight text-zinc-900">
						{#if selectedTemplate}
							{selectedTemplate.title}
						{:else}
							Create new issue
						{/if}
					</h3>
					<span
						class="rounded-md border border-zinc-200 bg-white px-2 py-0.5 text-[11px] font-medium text-zinc-600"
					>
						polinema-ui/{activeRepo}
					</span>
				</div>

				<div class="flex items-center gap-1">
					<a
						href={`https://github.com/polinema-ui/${activeRepo}/compare`}
						target="_blank"
						rel="noopener noreferrer"
						class="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50"
						title="Create Pull Request directly on GitHub"
					>
						<HugeiconsIcon icon={GitPullRequestIcon} size={13} />
						<span>Buat PR di GitHub</span>
					</a>
					<button
						type="button"
						onclick={close}
						class="flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
						aria-label="Close"
					>
						<HugeiconsIcon icon={Cancel01Icon} size={15} />
					</button>
				</div>
			</div>

			{#if isSuccess}
				<div class="flex flex-col items-center justify-center p-10 text-center">
					<div
						class="flex h-12 w-12 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-600"
					>
						<HugeiconsIcon icon={CheckmarkCircle02Icon} size={28} />
					</div>
					<h4 class="mt-3 text-base font-bold text-zinc-900">Ticket Berhasil Dibuat!</h4>
					<p class="mt-1 text-xs text-zinc-500">
						Notifikasi update progress akan dikirimkan ke <span class="font-medium text-zinc-900"
							>{email}</span
						>.
					</p>
				</div>
			{:else if selectedTemplate}
				<form onsubmit={handleSubmit} class="space-y-4 p-5">
					<div>
						<div class="flex items-center justify-between">
							<label for="issue-title" class="block text-xs font-semibold text-zinc-800">
								Issue Title <span class="text-red-500">*</span>
							</label>
							<span class="text-[11px] text-zinc-400">Template applied</span>
						</div>
						<input
							id="issue-title"
							type="text"
							bind:value={title}
							required
							placeholder="Short summary of the bug or component request"
							class="mt-1.5 w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-sm text-zinc-900 shadow-2xs outline-none placeholder:text-zinc-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
						/>
					</div>

					<div>
						<label for="issue-email" class="block text-xs font-semibold text-zinc-800">
							Notification Email <span class="text-red-500">*</span>
						</label>
						<input
							id="issue-email"
							type="email"
							bind:value={email}
							required
							placeholder="your-name@polinema.ac.id"
							class="mt-1.5 w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-sm text-zinc-900 shadow-2xs outline-none placeholder:text-zinc-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
						/>
						<p class="mt-1 text-[11px] text-zinc-500">
							You will receive automated notifications when a PR is linked, assigned, or merged.
						</p>
					</div>

					<div>
						<div class="flex items-center justify-between">
							<label for="issue-desc" class="block text-xs font-semibold text-zinc-800">
								Structured Template (English Markdown) <span class="text-red-500">*</span>
							</label>
							<span class="text-[11px] text-zinc-400">Edit sections as needed</span>
						</div>
						<textarea
							id="issue-desc"
							bind:value={description}
							required
							rows={8}
							class="mt-1.5 w-full rounded-xl border border-zinc-200 bg-zinc-50/50 p-3 font-mono text-xs leading-relaxed text-zinc-800 outline-none placeholder:text-zinc-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
						></textarea>
					</div>

					<div class="flex flex-col gap-2 pt-2 sm:flex-row sm:items-center sm:justify-between">
						<button
							type="button"
							onclick={() => (selectedTemplate = null)}
							class="text-xs font-medium text-zinc-500 hover:text-zinc-900"
						>
							&larr; Choose different template
						</button>

						<div class="flex flex-wrap items-center gap-2">
							<a
								href={githubDirectUrl}
								target="_blank"
								rel="noopener noreferrer"
								class="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 shadow-2xs hover:bg-zinc-50 hover:text-zinc-900"
								title="Open GitHub's native issue form with this pre-filled template"
							>
								<span>Open on GitHub</span>
								<HugeiconsIcon icon={ArrowUpRight01Icon} size={13} />
							</a>

							<Button
								type="submit"
								variant="default"
								size="sm"
								disabled={isSubmitting}
								class="bg-blue-600 text-white shadow-2xs hover:bg-blue-700"
							>
								{isSubmitting ? 'Submitting...' : 'Submit with Email Alert'}
							</Button>
						</div>
					</div>
				</form>
			{:else}
				<div class="divide-y divide-zinc-100">
					{#each templates as tmpl (tmpl.id)}
						<button
							type="button"
							onclick={() => handleSelect(tmpl)}
							class="group flex w-full items-center justify-between px-5 py-3.5 text-left transition-colors hover:bg-zinc-50/80"
						>
							<div class="pr-4">
								<p class="text-xs font-bold text-zinc-900 group-hover:text-blue-600 sm:text-sm">
									{tmpl.title}
								</p>
								<p class="mt-0.5 text-xs text-zinc-500">
									{tmpl.description}
								</p>
							</div>

							<div class="shrink-0 text-zinc-400 group-hover:text-zinc-600">
								{#if tmpl.icon === 'shield'}
									<HugeiconsIcon icon={Shield01Icon} size={16} />
								{:else if tmpl.icon === 'external'}
									<HugeiconsIcon icon={ArrowUpRight01Icon} size={16} />
								{:else}
									<HugeiconsIcon icon={ArrowRight01Icon} size={16} />
								{/if}
							</div>
						</button>
					{/each}
				</div>

				<div
					class="flex items-center justify-between border-t border-zinc-100 bg-zinc-50/70 px-5 py-3 text-xs text-zinc-500"
				>
					<span>Perlu PR langsung?</span>
					<a
						href={`https://github.com/polinema-ui/${activeRepo}/compare`}
						target="_blank"
						rel="noopener noreferrer"
						class="inline-flex items-center gap-1 font-semibold text-blue-600 hover:underline"
					>
						<span>Open Pull Request on GitHub</span>
						<HugeiconsIcon icon={ArrowUpRight01Icon} size={13} />
					</a>
				</div>
			{/if}
		</div>
	</div>
{/if}
