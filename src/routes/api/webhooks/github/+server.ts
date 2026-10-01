import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { z } from 'zod';
import {
	notifyCentral,
	notifyAssignee,
	notifyRequester,
	resolveAssigneeEmail
} from '@/lib/server/email.js';

const githubWebhookSchema = z.object({
	action: z.string().optional(),
	zen: z.string().optional(),
	sender: z.object({ login: z.string().optional() }).passthrough().optional(),
	repository: z.object({ name: z.string().optional() }).passthrough().optional(),
	assignee: z.object({ login: z.string().optional() }).passthrough().optional(),
	label: z.object({ name: z.string().optional() }).passthrough().optional(),
	issue: z.object({
		title: z.string().optional(),
		body: z.string().nullable().optional(),
		html_url: z.string().optional(),
		number: z.number().optional(),
		user: z.object({ login: z.string().optional() }).passthrough().optional(),
		assignee: z.object({ login: z.string().optional() }).passthrough().nullable().optional()
	}).passthrough().optional(),
	pull_request: z.object({
		title: z.string().optional(),
		body: z.string().nullable().optional(),
		html_url: z.string().optional(),
		number: z.number().optional(),
		user: z.object({ login: z.string().optional() }).passthrough().optional(),
		merged: z.boolean().optional()
	}).passthrough().optional(),
	comment: z.object({
		body: z.string().optional(),
		html_url: z.string().optional(),
		user: z.object({ login: z.string().optional() }).passthrough().optional()
	}).passthrough().optional(),
	review: z.object({
		body: z.string().optional(),
		html_url: z.string().optional(),
		user: z.object({ login: z.string().optional() }).passthrough().optional()
	}).passthrough().optional()
}).passthrough();

const extractReporterEmail = (body: string): string | null => {
	let email: string | null = null;
	const formMatch = body.match(/###\s*Notification email\s*\n+\s*([^\s<>]+@[^\s<>]+\.[^\s<>]+)/i);
	if (formMatch) email = formMatch[1].trim();
	if (!email) {
		const inlineMatch = body.match(/email\s*:\s*([^\s<>]+@[^\s<>]+\.[^\s<>]+)/i);
		if (inlineMatch) email = inlineMatch[1].trim();
	}
	if (!email) {
		const anyMatch = body.match(/([^\s<>]+@[^\s<>]+\.[^\s<>]+)/);
		if (anyMatch) email = anyMatch[1].trim();
	}
	return email;
};

const verifySignature = async (
	raw: string,
	signature: string | null,
	secret: string
): Promise<boolean> => {
	if (!signature) return false;
	const encoder = new TextEncoder();
	const key = await crypto.subtle.importKey(
		'raw',
		encoder.encode(secret),
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign']
	);
	const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(raw));
	const hex =
		'sha256=' + Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, '0')).join('');
	return signature === hex;
};

export const POST: RequestHandler = async ({ request }) => {
	const raw = await request.text();
	const secret = env.GITHUB_WEBHOOK_SECRET || '';
	if (secret) {
		const sig = request.headers.get('x-hub-signature-256');
		const ok = await verifySignature(raw, sig, secret);
		if (!ok) return json({ error: 'Invalid signature' }, { status: 401 });
	}

	let payload: z.infer<typeof githubWebhookSchema>;
	try {
		payload = githubWebhookSchema.parse(JSON.parse(raw));
	} catch (err) {
		console.error('[webhook] Zod validation failed:', err);
		return json({ error: 'Invalid JSON or schema' }, { status: 400 });
	}

	const event = request.headers.get('x-github-event') || request.headers.get('X-GitHub-Event') || '';
	const action = payload.action || '';

	if (event === 'ping' || payload.zen !== undefined) {
		return json({ ok: true, ping: true });
	}

	const senderLogin = payload.sender?.login || 'github';
	const repoName = payload.repository?.name || 'p-ui';

	const safe = async (fn: () => Promise<void>) => {
		try {
			await fn();
		} catch (e) {
			console.error('[webhook email failed]', e);
		}
	};

	if (event === 'issues') {
		const issue = payload.issue;
		if (!issue) return json({ ok: true, skipped: true });
		
		const title = issue.title;
		const body = issue.body || '';
		const htmlUrl = issue.html_url;
		const number = issue.number;
		const authorLogin = issue.user?.login;
		const reporterEmail = extractReporterEmail(body);
		const assigneeLogin = payload.assignee?.login || issue.assignee?.login;

		if (['opened', 'closed', 'reopened', 'labeled', 'unlabeled'].includes(action)) {
			const labelName = payload.label?.name ? ` label:${payload.label.name}` : '';
			await safe(() =>
				notifyCentral({
					title: title || `Issue #${number ?? ''} ${action}`,
					body: `${body}${labelName ? `\n\n[${labelName.trim()}]` : ''}`,
					repo: repoName,
					author: authorLogin || senderLogin,
					htmlUrl,
					badge: `ISSUE ${action.toUpperCase()}`,
					issueNumber: number
				})
			);
			if ((action === 'opened' || action === 'closed' || action === 'reopened') && reporterEmail) {
				const isOpened = action === 'opened';
				const statusText = isOpened ? 'Opened' : action === 'closed' ? 'Closed' : 'Reopened';
				const metaText = isOpened
					? `<p style="margin:0"><strong>Status:</strong> Diterima dan menunggu review tim (dilaporkan oleh ${senderLogin})</p>`
					: `<p style="margin:0"><strong>Status:</strong> ${action} oleh ${senderLogin}</p>`;

				await safe(() =>
					notifyRequester({
						to: reporterEmail,
						subject: `[${statusText}] ${title} · ${repoName}#${number ?? ''}`,
						heading: title || `Issue #${number ?? ''}`,
						badge: isOpened ? 'OPENED' : action.toUpperCase(),
						repo: repoName,
						meta: metaText,
						body: body,
						htmlUrl
					})
				);
			}
			return json({ ok: true });
		}

		if (action === 'assigned' && assigneeLogin) {
			const assigneeEmail = resolveAssigneeEmail(assigneeLogin);
			const assignedBy = senderLogin;

			await safe(() =>
				notifyCentral({
					title: title || `Issue #${number ?? ''}`,
					body: `Assigned to ${assigneeLogin} by ${assignedBy}\n\n---\n\n${body}`,
					repo: repoName,
					author: assignedBy,
					htmlUrl,
					badge: 'ISSUE ASSIGNED'
				})
			);
			if (assigneeEmail) {
				await safe(() =>
					notifyAssignee({
						title: title || `Issue #${number ?? ''}`,
						body: body,
						repo: repoName,
						htmlUrl,
						assigneeLogin,
						assigneeEmail,
						assignedBy,
						issueNumber: number
					})
				);
			}
			if (reporterEmail) {
				await safe(() =>
					notifyRequester({
						to: reporterEmail,
						subject: `[Assigned] ${title} → ${assigneeLogin} · ${repoName}#${number ?? ''}`,
						heading: title || `Issue #${number ?? ''}`,
						badge: 'ASSIGNED',
						repo: repoName,
						meta: `<p style="margin:0"><strong>Di-assign ke:</strong> ${assigneeLogin} oleh ${assignedBy}</p>`,
						body: body,
						htmlUrl
					})
				);
			}
			return json({ ok: true, assigned: true });
		}

		if (action === 'unassigned') {
			return json({ ok: true, skipped: true });
		}

		return json({ ok: true, skipped: true, reason: `issue action ${action} ignored` });
	}

	if (event === 'pull_request') {
		const pr = payload.pull_request;
		if (!pr) return json({ ok: true, skipped: true });
		
		const title = pr.title;
		const body = pr.body || '';
		const htmlUrl = pr.html_url;
		const number = pr.number;
		const authorLogin = pr.user?.login;
		const reporterEmail = extractReporterEmail(body);
		const assigneeLogin = payload.assignee?.login;
		const isMerged = pr.merged === true;

		if (['opened', 'reopened', 'closed', 'labeled', 'unlabeled', 'synchronize', 'edited'].includes(action)) {
			const badge = action === 'closed' ? (isMerged ? 'PR MERGED' : 'PR CLOSED') : `PR ${action.toUpperCase()}`;
			await safe(() =>
				notifyCentral({
					title: title || `PR #${number ?? ''} ${action}`,
					body: body,
					repo: repoName,
					author: authorLogin || senderLogin,
					htmlUrl,
					badge
				})
			);
			if (action === 'closed' && reporterEmail) {
				await safe(() =>
					notifyRequester({
						to: reporterEmail,
						subject: `[${isMerged ? 'Merged' : 'Closed'}] ${title} · ${repoName}#${number ?? ''}`,
						heading: title || `PR #${number ?? ''}`,
						badge: isMerged ? 'MERGED' : 'CLOSED',
						repo: repoName,
						meta: `<p style="margin:0"><strong>${isMerged ? 'Di-merge' : 'Di-close'} oleh:</strong> ${senderLogin}</p><p style="margin:2px 0 0"><strong>PR:</strong> #${number ?? ''} oleh ${authorLogin ?? 'unknown'}</p>`,
						body: body,
						htmlUrl
					})
				);
			}
			return json({ ok: true });
		}

		if (action === 'assigned' && assigneeLogin) {
			const assigneeEmail = resolveAssigneeEmail(assigneeLogin);
			await safe(() =>
				notifyCentral({
					title: title || `PR #${number ?? ''}`,
					body: `PR assigned to ${assigneeLogin} by ${senderLogin}\n\n---\n\n${body}`,
					repo: repoName,
					author: senderLogin,
					htmlUrl,
					badge: 'PR ASSIGNED'
				})
			);
			if (assigneeEmail) {
				await safe(() =>
					notifyAssignee({
						title: title || `PR #${number ?? ''}`,
						body: body,
						repo: repoName,
						htmlUrl,
						assigneeLogin,
						assigneeEmail,
						assignedBy: senderLogin,
						issueNumber: number
					})
				);
			}
			if (reporterEmail) {
				await safe(() =>
					notifyRequester({
						to: reporterEmail,
						subject: `[Assigned] ${title} → ${assigneeLogin} · ${repoName}#${number ?? ''}`,
						heading: title || `PR #${number ?? ''}`,
						badge: 'ASSIGNED',
						repo: repoName,
						meta: `<p style="margin:0"><strong>PR kamu di-assign ke:</strong> ${assigneeLogin} oleh ${senderLogin}</p>`,
						body: body,
						htmlUrl
					})
				);
			}
			return json({ ok: true, assigned: true });
		}

		return json({ ok: true, skipped: true });
	}

	if (event === 'issue_comment' || event === 'pull_request_review_comment' || event === 'pull_request_review' || event === 'pull_request_review_thread') {
		if (action !== 'created' && action !== 'submitted' && action !== 'resolved' && action !== 'unresolved') {
			return json({ ok: true, skipped: true });
		}
		const issue = payload.issue || payload.pull_request;
		const commentVal = payload.comment || payload.review;
		if (!issue) return json({ ok: true, skipped: true });
		
		const issueTitle = issue.title || 'Thread';
		const issueBody = issue.body || '';
		const issueHtmlUrl = issue.html_url;
		const issueNumber = issue.number;
		const reporterEmail = extractReporterEmail(issueBody);
		if (!reporterEmail) return json({ ok: true, skipped: true });

		let commentBody = '';
		let commentUrl: string | undefined;
		let commenter = senderLogin;
		if (commentVal) {
			if (typeof commentVal.body === 'string') commentBody = commentVal.body;
			if (typeof commentVal.html_url === 'string') commentUrl = commentVal.html_url;
			const login = commentVal.user?.login;
			if (login) commenter = login;
		}
		
		await safe(() =>
			notifyRequester({
				to: reporterEmail,
				subject: `[Comment] ${issueTitle} · ${repoName}#${issueNumber ?? ''}`,
				heading: issueTitle,
				badge: 'COMMENT',
				repo: repoName,
				meta: `<p style="margin:0"><strong>Balasan dari:</strong> ${commenter}</p>`,
				body: commentBody || '(no body)',
				htmlUrl: commentUrl || issueHtmlUrl
			})
		);
		await safe(() =>
			notifyCentral({
				title: `Comment on ${issueTitle}`,
				body: `By ${commenter} on #${issueNumber ?? ''}:\n\n${commentBody}`,
				repo: repoName,
				author: commenter,
				htmlUrl: commentUrl || issueHtmlUrl,
				badge: 'COMMENT'
			})
		);
		return json({ ok: true, commented: true });
	}

	return json({ ok: true, skipped: true, reason: `event ${event} / action ${action} not handled` });
};
