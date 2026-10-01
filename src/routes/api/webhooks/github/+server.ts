import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import {
	notifyCentral,
	notifyAssignee,
	notifyRequester,
	resolveAssigneeEmail
} from '@/lib/server/email.js';

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

const getString = (obj: Record<string, unknown>, key: string): string | undefined => {
	const v = obj[key];
	return typeof v === 'string' ? v : undefined;
};

const getNumber = (obj: Record<string, unknown>, key: string): number | undefined => {
	const v = obj[key];
	return typeof v === 'number' ? v : undefined;
};

const getLogin = (obj: unknown): string | undefined => {
	if (!obj || typeof obj !== 'object' || !('login' in obj)) return undefined;
	const v = (obj as Record<string, unknown>).login;
	return typeof v === 'string' ? v : undefined;
};

export const POST: RequestHandler = async ({ request }) => {
	const raw = await request.text();
	const secret = env.GITHUB_WEBHOOK_SECRET || '';
	if (secret) {
		const sig = request.headers.get('x-hub-signature-256');
		const ok = await verifySignature(raw, sig, secret);
		if (!ok) return json({ error: 'Invalid signature' }, { status: 401 });
	}

	let payload: Record<string, unknown>;
	try {
		payload = JSON.parse(raw) as Record<string, unknown>;
	} catch {
		return json({ error: 'Invalid JSON' }, { status: 400 });
	}

	const event = request.headers.get('x-github-event') || request.headers.get('X-GitHub-Event') || '';
	const actionVal = payload.action;
	const action = typeof actionVal === 'string' ? actionVal : '';

	// ping when webhook created
	if (event === 'ping' || 'zen' in payload) {
		return json({ ok: true, ping: true });
	}

	const senderLogin = getLogin(payload.sender) || 'github';
	const repoName = (() => {
		const r = payload.repository;
		if (r && typeof r === 'object' && 'name' in r) {
			const v = (r as Record<string, unknown>).name;
			if (typeof v === 'string') return v;
		}
		return 'p-ui';
	})();

	// helper: safe fire without failing whole webhook
	const safe = async (fn: () => Promise<void>) => {
		try {
			await fn();
		} catch (e) {
			console.error('[webhook email failed]', e);
		}
	};

	// ── ISSUES ──────────────────────────────────────────────
	if (event === 'issues') {
		const issueVal = payload.issue;
		if (!issueVal || typeof issueVal !== 'object') return json({ ok: true, skipped: true });
		const issue = issueVal as Record<string, unknown>;
		const title = getString(issue, 'title');
		const body = getString(issue, 'body') || '';
		const htmlUrl = getString(issue, 'html_url');
		const number = getNumber(issue, 'number');
		const authorLogin = getLogin(issue.user);
		const reporterEmail = extractReporterEmail(body);
		const assigneeLogin = getLogin(payload.assignee) || getLogin(issue.assignee);

		// 1) open/close/reopen/labeled/unlabeled → central polinema.ui@gmail.com
		if (['opened', 'closed', 'reopened', 'labeled', 'unlabeled'].includes(action)) {
			const labelName = (() => {
				const l = payload.label;
				if (l && typeof l === 'object' && 'name' in l) {
					const v = (l as Record<string, unknown>).name;
					if (typeof v === 'string') return ` label:${v}`;
				}
				return '';
			})();
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
				const statusText = isOpened ? 'Received' : action === 'closed' ? 'Closed' : 'Reopened';
				const metaText = isOpened
					? `<p style="margin:0"><strong>Status:</strong> Diterima dan menunggu review tim (dilaporkan oleh ${senderLogin})</p>`
					: `<p style="margin:0"><strong>Status:</strong> ${action} oleh ${senderLogin}</p>`;

				await safe(() =>
					notifyRequester({
						to: reporterEmail,
						subject: `[${statusText}] ${title} · ${repoName}#${number ?? ''}`,
						heading: title || `Issue #${number ?? ''}`,
						badge: isOpened ? 'RECEIVED' : action.toUpperCase(),
						repo: repoName,
						meta: metaText,
						body: body,
						htmlUrl
					})
				);
			}
			return json({ ok: true });
		}

		// 2) assigned → ke assignee (rriovld/rafiabiyyu) + central + requester
		if (action === 'assigned' && assigneeLogin) {
			const assigneeEmail = resolveAssigneeEmail(assigneeLogin);
			const assignedBy = senderLogin;

			// central tetap dapat
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
			// ke orang yang di-assign
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
			// ke requester: "PR/issue kamu di-assign oleh siapa"
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

	// ── PULL REQUEST ───────────────────────────────────────
	if (event === 'pull_request') {
		const prVal = payload.pull_request;
		if (!prVal || typeof prVal !== 'object') return json({ ok: true, skipped: true });
		const pr = prVal as Record<string, unknown>;
		const title = getString(pr, 'title');
		const body = getString(pr, 'body') || '';
		const htmlUrl = getString(pr, 'html_url');
		const number = getNumber(pr, 'number');
		const authorLogin = getLogin(pr.user);
		const reporterEmail = extractReporterEmail(body);
		const assigneeLogin = getLogin(payload.assignee);
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
			// closed/merged → requester dapat notif
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

	// ── ISSUE COMMENT / PR COMMENT (balasan) ───────────────
	if (event === 'issue_comment' || event === 'pull_request_review_comment' || event === 'pull_request_review' || event === 'pull_request_review_thread') {
		if (action !== 'created' && action !== 'submitted' && action !== 'resolved' && action !== 'unresolved') {
			return json({ ok: true, skipped: true });
		}
		const issueVal = payload.issue || payload.pull_request;
		const commentVal = payload.comment || payload.review;
		if (!issueVal || typeof issueVal !== 'object') return json({ ok: true, skipped: true });
		const issue = issueVal as Record<string, unknown>;
		const issueTitle = getString(issue, 'title') || 'Thread';
		const issueBody = getString(issue, 'body') || '';
		const issueHtmlUrl = getString(issue, 'html_url');
		const issueNumber = getNumber(issue, 'number');
		const reporterEmail = extractReporterEmail(issueBody);
		if (!reporterEmail) return json({ ok: true, skipped: true });

		let commentBody = '';
		let commentUrl: string | undefined;
		let commenter = senderLogin;
		if (commentVal && typeof commentVal === 'object') {
			const c = commentVal as Record<string, unknown>;
			if (typeof c.body === 'string') commentBody = c.body;
			if (typeof c.html_url === 'string') commentUrl = c.html_url;
			const u = c.user;
			const login = getLogin(u);
			if (login) commenter = login;
		}
		// jangan kirim ke diri sendiri kalau yang komen = requester sendiri (optional, tapi tetap kasih central)
		// untuk sekarang tetap kirim biar requester tau ada balasan (bisa dari maintainer)
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
		// central juga dapat ringkasan comment
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
