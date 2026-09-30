import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { sendIssueNotification } from '@/lib/server/email.js';

export const POST: RequestHandler = async ({ request }) => {
	let payload: {
		title?: string;
		body?: string;
		reporterEmail?: string;
		repo?: string;
		author?: string;
		htmlUrl?: string;
	};

	try {
		payload = await request.json();
	} catch {
		return json({ error: 'Invalid JSON' }, { status: 400 });
	}

	if (!payload.title?.trim() || !payload.body?.trim() || !payload.reporterEmail?.trim()) {
		return json({ error: 'title, body, reporterEmail required' }, { status: 400 });
	}

	const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	if (!emailPattern.test(payload.reporterEmail)) {
		return json({ error: 'Invalid email' }, { status: 400 });
	}

	try {
		await sendIssueNotification({
			title: payload.title.trim(),
			body: payload.body.trim(),
			reporterEmail: payload.reporterEmail.trim(),
			repo: payload.repo?.trim() || 'p-ui',
			author: payload.author?.trim() || 'anonymous',
			htmlUrl: payload.htmlUrl
		});
		return json({ ok: true });
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Failed to send email';
		return json({ error: message }, { status: 500 });
	}
};
