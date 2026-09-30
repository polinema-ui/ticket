import nodemailer from 'nodemailer';
import { env } from '$env/dynamic/private';

type NotifyPayload = {
	title: string;
	body: string;
	reporterEmail: string;
	repo: string;
	author: string;
	htmlUrl?: string;
};

const getMaintainers = (): string[] => {
	const raw = env.MAINTAINER_EMAILS || 'rriovld@gmail.com,rafiabiyyu.dev@gmail.com';
	return raw
		.split(',')
		.map((s) => s.trim())
		.filter(Boolean);
};

const getCentralEmail = (): string => env.GMAIL_USER || 'polinema.ui@gmail.com';

const ASSIGNEE_EMAIL_MAP: Record<string, string> = {
	ckckckcz: 'rriovld@gmail.com',
	rriovld: 'rriovld@gmail.com',
	kajekaito: 'rriovld@gmail.com',
	rafiabiyyu: 'rafiabiyyu.dev@gmail.com',
	'rafiabiyyu.dev': 'rafiabiyyu.dev@gmail.com',
	rafiabiyyu_dev: 'rafiabiyyu.dev@gmail.com'
};

export const resolveAssigneeEmail = (login?: string): string | null => {
	if (!login) return null;
	const key = login.toLowerCase();
	if (ASSIGNEE_EMAIL_MAP[key]) return ASSIGNEE_EMAIL_MAP[key];
	if (ASSIGNEE_EMAIL_MAP[login]) return ASSIGNEE_EMAIL_MAP[login];
	return null;
};

const buildTransporter = () => {
	const user = env.GMAIL_USER || 'polinema.ui@gmail.com';
	const pass = env.GMAIL_APP_PASSWORD;
	if (!pass) throw new Error('Missing GMAIL_APP_PASSWORD');
	return nodemailer.createTransport({ service: 'gmail', auth: { user, pass } });
};

type MailOpts = { to: string; subject: string; html: string; replyTo?: string };

const sendMail = async (opts: MailOpts) => {
	const transporter = buildTransporter();
	const from = getCentralEmail();
	await transporter.sendMail({ from, to: opts.to, subject: opts.subject, html: opts.html, replyTo: opts.replyTo });
};

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const linkify = (text: string): string => {
	let html = esc(text);
	html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" style="color:#2563eb;text-decoration:underline;word-break:break-all">$1</a>');

	html = html.replace(/(?<!href=")(https?:\/\/[^\s<]+)/g, '<a href="$1" style="color:#2563eb;text-decoration:underline;word-break:break-all">$1</a>');
	return html;
};

const renderInlineBody = (raw: string): string => {
	const trimmed = raw.trim();
	if (!trimmed) return '<span style="color:#a1a1aa;font-style:italic">—</span>';
	const parts = trimmed.split(/```/);
	let out = '';
	for (let i = 0; i < parts.length; i++) {
		if (i % 2 === 1) {
			const code = esc(parts[i].replace(/^\w*\n/, '')).trim();
			out += `<pre style="margin:8px 0 0;padding:10px 12px;background:#18181b;color:#e4e4e7;border-radius:8px;font-family:ui-monospace, SFMono-Regular, Menlo, monospace;font-size:12px;line-height:1.5;white-space:pre-wrap;word-break:break-word;overflow-wrap:anywhere">${code}</pre>`;
		} else {
			const text = parts[i].trim();
			if (!text) continue;
			const paras = text.split(/\n{2,}/);
			for (const p of paras) {
				const linked = linkify(p);
				const withBreaks = linked.replace(/\n/g, '<br/>');
				out += `<p style="margin:0 0 8px;font-size:13px;line-height:1.65;color:#27272a">${withBreaks}</p>`;
			}
		}
	}
	return out || '<span style="color:#a1a1aa;font-style:italic">—</span>';
};

type Section = { label: string; content: string };

const parseSections = (body: string): Section[] => {
	const rawSections = body
		.split(/\n###\s+/)
		.map((s) => s.trim())
		.filter(Boolean);

	const sections: Section[] = [];
	for (let chunk of rawSections) {
		chunk = chunk.replace(/^###\s+/, '').replace(/^##\s+/, '').trim();
		const nl = chunk.indexOf('\n');
		if (nl === -1) {
			if (chunk) sections.push({ label: chunk, content: '' });
			continue;
		}
		const label = chunk.slice(0, nl).trim();
		const content = chunk.slice(nl + 1).trim();
		if (!label) continue;
		sections.push({ label, content });
	}
	return sections;
};

const renderSections = (body: string): string => {
	const sections = parseSections(body);
	const visible = sections.filter((s) => !/notification email/i.test(s.label));
	if (visible.length === 0) {
		return `<div style="padding:4px 0">${renderInlineBody(body)}</div>`;
	}
	let html = '';
	for (const sec of visible) {
		const label = esc(sec.label);
		const isEmpty = !sec.content || sec.content === '```text\n\n```' || sec.content.replace(/[`\s]/g, '') === '';
		html += `
			<div style="padding:12px 14px;border-bottom:1px solid #f4f4f5">
				<div style="margin:0 0 6px;font-family:'Plus Jakarta Sans',ui-sans-serif,system-ui,sans-serif;font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#71717a">${label}</div>
				<div>${isEmpty ? '<span style="color:#a1a1aa;font-size:12px;font-style:italic">Not provided</span>' : renderInlineBody(sec.content)}</div>
			</div>`;
	}

	html = html.replace('border-bottom:1px solid #f4f4f5"', 'border-bottom:none"');
	return html;
};

const badgeStyle = (badge: string): string => {
	const b = badge.toLowerCase();
	if (b.includes('assigned')) return 'background:#18181b;color:#fff;border:1px solid #18181b';
	if (b.includes('merged')) return 'background:#dcfce7;color:#166534;border:1px solid #bbf7d0';
	if (b.includes('closed')) return 'background:#fee2e2;color:#991b1b;border:1px solid #fecaca';
	if (b.includes('comment')) return 'background:#ffedd5;color:#9a3412;border:1px solid #fed7aa';
	if (b.includes('opened')) return 'background:#eff6ff;color:#1d4ed8;border:1px solid #dbeafe';
	return 'background:#f4f4f5;color:#27272a;border:1px solid #e4e4e7';
};

const baseTemplate = (opts: {
	badge: string;
	title: string;
	repo: string;
	issueNumber?: number;
	metaLine: string;
	body: string;
	htmlUrl?: string;
	footerNote?: string;
	ctaLabel?: string;
}): string => {
	const badgeHtml = opts.badge
		? `<span style="display:inline-block;padding:2px 9px;border-radius:9999px;font-family:'Plus Jakarta Sans',ui-sans-serif,system-ui,sans-serif;font-size:10px;font-weight:700;letter-spacing:.06em;${badgeStyle(opts.badge)}">${esc(opts.badge)}</span>`
		: '';
	const repoPill = `<span style="font-family:'Plus Jakarta Sans',ui-sans-serif,system-ui,sans-serif;font-size:11px;color:#71717a">polinema-ui/${esc(opts.repo)}${opts.issueNumber ? ` · #${opts.issueNumber}` : ''}</span>`;
	const safeTitle = esc(opts.title).replace(/"/g, '&quot;');

	return `<!doctype html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700&display=swap" rel="stylesheet"/>
</head>
<body style="margin:0;padding:0;background:#f8fafc">
<div style="background:#f4f4f5;padding:28px 16px">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr><td align="center">
	<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="width:600px;max-width:100%">
		<tr><td align="center" style="padding:8px 0 18px">
			<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
				<td style="width:28px;height:28px;background:#18181b;border-radius:8px;text-align:center;vertical-align:middle">
					<span style="font-family:'Plus Jakarta Sans',ui-sans-serif,system-ui,sans-serif;font-weight:800;font-size:13px;color:#fff;line-height:28px;display:block">P</span>
				</td>
				<td style="padding-left:8px;vertical-align:middle">
					<span style="font-family:'Plus Jakarta Sans',ui-sans-serif,system-ui,sans-serif;font-weight:700;font-size:13px;letter-spacing:-.02em;color:#18181b">Polinema Ticket</span>
					<span style="font-family:'Plus Jakarta Sans',ui-sans-serif,system-ui,sans-serif;font-size:11px;color:#71717a"> · p-ui</span>
				</td>
			</tr></table>
		</td></tr>
		<tr><td>
			<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#ffffff;border:1px solid #e4e4e7;border-radius:16px;overflow:hidden">
				<tr><td style="height:3px;line-height:3px;background:#18181b;font-size:0">&nbsp;</td></tr>
				<tr><td style="padding:22px 22px 10px 22px">
					<div style="margin:0 0 10px">${badgeHtml} <span style="margin-left:6px">${repoPill}</span></div>
					<h1 style="margin:0;font-family:'Plus Jakarta Sans',ui-sans-serif,system-ui,sans-serif;font-size:17px;line-height:1.35;font-weight:700;color:#18181b;letter-spacing:-.02em">${safeTitle}</h1>
					<div style="margin:7px 0 0;font-family:'Plus Jakarta Sans',ui-sans-serif,system-ui,sans-serif;font-size:11px;line-height:1.5;color:#71717a">${opts.metaLine}</div>
				</td></tr>
				<tr><td style="padding:8px 16px 16px 16px">
					<div style="background:#ffffff;border:1px solid #e4e4e7;border-radius:12px;overflow:hidden">
						${renderSections(opts.body)}
					</div>
					${
						opts.htmlUrl
							? `<div style="text-align:center;padding:18px 0 4px">
								<a href="${esc(opts.htmlUrl)}" style="display:inline-block;padding:11px 22px;background:#18181b;color:#ffffff;border-radius:9999px;font-family:'Plus Jakarta Sans',ui-sans-serif,system-ui,sans-serif;font-size:13px;font-weight:600;text-decoration:none;letter-spacing:-.01em">${esc(opts.ctaLabel || 'View on GitHub →')}</a>
							</div>
							<div style="text-align:center;padding-top:8px">
								<a href="${esc(opts.htmlUrl)}" style="font-family:'Plus Jakarta Sans',ui-sans-serif,system-ui,sans-serif;font-size:11px;color:#2563eb;word-break:break-all;text-decoration:none">${esc(opts.htmlUrl)}</a>
							</div>`
							: ''
					}
				</td></tr>
			</table>
		</td></tr>
		<tr><td align="center" style="padding:14px 10px 6px">
			<p style="margin:0;font-family:'Plus Jakarta Sans',ui-sans-serif,system-ui,sans-serif;font-size:11px;line-height:1.5;color:#a1a1aa">${esc(opts.footerNote || 'You are receiving this because you are subscribed to Polinema UI notifications. Reply to this email to leave a comment on GitHub.')}</p>
			<p style="margin:6px 0 0;font-family:'Plus Jakarta Sans',ui-sans-serif,system-ui,sans-serif;font-size:11px;color:#a1a1aa">Polinema Ticket · <a href="https://ticket.p-ui.deno.net" style="color:#71717a;text-decoration:underline">ticket.p-ui.deno.net</a> · polinema.ui@gmail.com</p>
		</td></tr>
	</table>
</td></tr></table>
</div>
</body>
</html>`;
};

export const sendIssueNotification = async (payload: NotifyPayload) => {
	const match = payload.htmlUrl?.match(/\/issues\/(\d+)|\/pull\/(\d+)/);
	const num = match ? Number(match[1] || match[2]) : undefined;
	const html = baseTemplate({
		badge: 'TICKET',
		title: payload.title,
		repo: payload.repo,
		issueNumber: num,
		metaLine: `Reporter · <span style="font-weight:600;color:#27272a">${esc(payload.author)}</span> &lt;${esc(payload.reporterEmail)}&gt;`,
		body: payload.body,
		htmlUrl: payload.htmlUrl,
		ctaLabel: payload.htmlUrl ? 'View on GitHub →' : undefined,
		footerNote: 'This is a ticket created via Polinema Ticket. Maintainers have been notified.'
	});
	await sendMail({ to: [...getMaintainers(), payload.reporterEmail].join(', '), subject: `[Polinema Ticket] ${payload.title} · ${payload.repo}`, html, replyTo: payload.reporterEmail });
};

export const notifyCentral = async (opts: { title: string; body: string; repo: string; author: string; htmlUrl?: string; badge: string; issueNumber?: number }) => {
	const html = baseTemplate({
		badge: opts.badge,
		title: opts.title,
		repo: opts.repo,
		issueNumber: opts.issueNumber,
		metaLine: `By <span style="font-weight:600;color:#27272a">${esc(opts.author)}</span> · Central inbox`,
		body: opts.body,
		htmlUrl: opts.htmlUrl,
		footerNote: 'Central inbox · polinema.ui@gmail.com · All open/close/label activity lands here.'
	});
	await sendMail({ to: getCentralEmail(), subject: `[${opts.badge}] ${opts.title} · ${opts.repo}${opts.issueNumber ? `#${opts.issueNumber}` : ''}`, html, replyTo: getCentralEmail() });
};

export const notifyAssignee = async (opts: {
	title: string;
	body: string;
	repo: string;
	htmlUrl?: string;
	assigneeLogin: string;
	assigneeEmail: string;
	assignedBy: string;
	issueNumber?: number;
}) => {
	const html = baseTemplate({
		badge: 'ASSIGNED',
		title: opts.title,
		repo: opts.repo,
		issueNumber: opts.issueNumber,
		metaLine: `Assigned to <span style="font-weight:700;color:#18181b">${esc(opts.assigneeLogin)}</span> · by ${esc(opts.assignedBy)} &lt;${esc(opts.assigneeEmail)}&gt;`,
		body: opts.body,
		htmlUrl: opts.htmlUrl,
		ctaLabel: 'View assignment →',
		footerNote: `You were assigned to polinema-ui/${opts.repo} #${opts.issueNumber ?? ''}. Reply to comment directly.`
	});
	await sendMail({ to: opts.assigneeEmail, subject: `[Assigned] ${opts.title} → ${opts.assigneeLogin} · ${opts.repo}${opts.issueNumber ? `#${opts.issueNumber}` : ''}`, html, replyTo: getCentralEmail() });
};

export const notifyRequester = async (opts: {
	to: string;
	subject: string;
	heading: string;
	badge: string;
	repo: string;
	meta: string; // html
	body: string;
	htmlUrl?: string;
	issueNumber?: number;
}) => {
	const html = baseTemplate({
		badge: opts.badge,
		title: opts.heading,
		repo: opts.repo,
		issueNumber: opts.issueNumber,
		metaLine: opts.meta,
		body: opts.body,
		htmlUrl: opts.htmlUrl,
		footerNote: 'You received this because you opened this issue/PR. Reply to this email to comment on GitHub.'
	});
	await sendMail({ to: opts.to, subject: opts.subject, html, replyTo: getCentralEmail() });
};
