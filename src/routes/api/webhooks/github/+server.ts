import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { sendIssueNotification } from '@/lib/server/email.js';

const extractAuthenticReport = (
	body: string
): { email: string; title: string; repo: string; author: string; htmlUrl?: string } | null => {
	// GitHub Issue Forms render as "### Notification email\n\nemail@domain"
	// legacy inline format is "email: email@domain"
	let email: string | null = null;

	const formMatch = body.match(/###\s*Notification email\s*\n+\s*([^\s<>]+@[^\s<>]+\.[^\s<>]+)/i);
	if (formMatch) email = formMatch[1].trim();

	if (!email) {
		const inlineMatch = body.match(/email\s*:\s*([^\s<>]+@[^\s<>]+\.[^\s<>]+)/i);
		if (inlineMatch) email = inlineMatch[1].trim();
	}

	// fallback: any email in body
	if (!email) {
		const anyMatch = body.match(/([^\s<>]+@[^\s<>]+\.[^\s<>]+)/);
		if (anyMatch) email = anyMatch[1].trim();
	}

	if (!email) return null;

	const titleMatch = body.match(/^###\s*(.+)\n/m);
	const titleRaw = titleMatch ? titleMatch[1].trim().slice(0, 120) : 'New GitHub Issue';
	return { email, title: titleRaw, repo: '', author: '', htmlUrl: undefined };
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

	let payload: Record<string, unknown>;
	try {
		payload = JSON.parse(raw) as Record<string, unknown>;
	} catch {
		return json({ error: 'Invalid JSON' }, { status: 400 });
	}

	const actionVal = payload.action;
	const action = typeof actionVal === 'string' ? actionVal : undefined;
	if (action !== 'opened' && action !== 'reopened' && action !== 'assigned') {
		return json({ ok: true, skipped: true, reason: `unsupported action: ${action ?? 'unknown'}` });
	}

	// Narrow issue object without inline casts
	let issueTitle: string | undefined;
	let issueBody: string | undefined;
	let issueHtmlUrl: string | undefined;
	let issueUserLogin: string | undefined;
	let issueNumber: number | undefined;

	const issueVal = payload.issue;
	if (issueVal && typeof issueVal === 'object' && 'title' in issueVal) {
		const rec = issueVal as Record<string, unknown>;
		if (typeof rec.title === 'string') issueTitle = rec.title;
		if (typeof rec.body === 'string') issueBody = rec.body;
		if (typeof rec.html_url === 'string') issueHtmlUrl = rec.html_url;
		if (typeof rec.number === 'number') issueNumber = rec.number;
		const userVal = rec.user;
		if (userVal && typeof userVal === 'object' && 'login' in userVal) {
			const loginVal = (userVal as Record<string, unknown>).login;
			if (typeof loginVal === 'string') issueUserLogin = loginVal;
		}
	}

	let repoName: string | undefined;
	const repoVal = payload.repository;
	if (repoVal && typeof repoVal === 'object' && 'name' in repoVal) {
		const nameVal = (repoVal as Record<string, unknown>).name;
		if (typeof nameVal === 'string') repoName = nameVal;
	}

	let assigneeLogin: string | undefined;
	const assigneeVal = payload.assignee;
	if (assigneeVal && typeof assigneeVal === 'object' && 'login' in assigneeVal) {
		const loginVal = (assigneeVal as Record<string, unknown>).login;
		if (typeof loginVal === 'string') assigneeLogin = loginVal;
	}

	if (!issueTitle || !issueBody) {
		return json({ ok: true, skipped: true });
	}

	const extracted = extractAuthenticReport(issueBody);
	if (!extracted) return json({ ok: true, skipped: true });

	try {
		const isAssigned = action === 'assigned';
		const displayTitle = isAssigned
			? `[Assigned to ${assigneeLogin ?? 'someone'}] ${issueTitle}`
			: issueTitle;
		const displayBody = isAssigned
			? `Issue #${issueNumber ?? ''} assigned to ${assigneeLogin ?? 'someone'}.\n\n---\n\n${issueBody}`
			: issueBody;

		await sendIssueNotification({
			title: displayTitle,
			body: displayBody,
			reporterEmail: extracted.email,
			repo: repoName || extracted.repo || 'p-ui',
			author: issueUserLogin || extracted.author || 'github-user',
			htmlUrl: issueHtmlUrl
		});
		return json({ ok: true, assigned: isAssigned });
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Failed to send email';
		return json({ error: message }, { status: 500 });
	}
};
