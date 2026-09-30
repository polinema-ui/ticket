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

	// fallback: any email in body (jaga2 format berubah lagi)
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

	const action = payload.action as string | undefined;
	if (action !== 'opened' && action !== 'reopened') {
		return json({ ok: true, skipped: true });
	}

	const issue = payload.issue as
		{ title?: string; body?: string; html_url?: string; user?: { login?: string } } | undefined;
	const repo = payload.repository as { name?: string } | undefined;

	if (!issue?.title || !issue?.body) {
		return json({ ok: true, skipped: true });
	}

	const extracted = extractAuthenticReport(issue.body);
	if (!extracted) return json({ ok: true, skipped: true });

	try {
		await sendIssueNotification({
			title: issue.title,
			body: issue.body,
			reporterEmail: extracted.email,
			repo: repo?.name || extracted.repo || 'p-ui',
			author: issue.user?.login || extracted.author || 'github-user',
			htmlUrl: issue.html_url
		});
		return json({ ok: true });
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Failed to send email';
		return json({ error: message }, { status: 500 });
	}
};
