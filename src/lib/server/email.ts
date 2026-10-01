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
	if (b.includes('assigned')) return 'background:#f59e0b;color:#ffffff;border:1px solid #f59e0b';
	if (b.includes('merged')) return 'background:#16a34a;color:#ffffff;border:1px solid #16a34a';
	if (b.includes('closed')) return 'background:#dc2626;color:#ffffff;border:1px solid #dc2626';
	if (b.includes('comment')) return 'background:#8b5cf6;color:#ffffff;border:1px solid #8b5cf6';
	if (b.includes('opened') || b.includes('received')) return 'background:#0066FF;color:#ffffff;border:1px solid #0066FF';
	return 'background:#52525b;color:#ffffff;border:1px solid #52525b';
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
		? `<span style="display:inline-block;padding:4px 12px;border-radius:9999px;font-family:'Plus Jakarta Sans',ui-sans-serif,system-ui,sans-serif;font-size:10px;font-weight:700;letter-spacing:.05em;${badgeStyle(opts.badge)}">${esc(opts.badge)}</span>`
		: '';
	const safeTitle = esc(opts.title).replace(/"/g, '&quot;');
	const dateString = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

	return `<!doctype html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700&display=swap" rel="stylesheet"/>
</head>
<body style="margin:0;padding:0;background:#f4f5f7;font-family:'Plus Jakarta Sans',ui-sans-serif,system-ui,sans-serif;">

<!-- Header -->
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#0066FF;">
<tr><td align="center">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="width:600px;max-width:100%;padding:16px 20px;">
        <tr>
            <td align="left" style="color:#ffffff;font-size:15px;font-weight:700;letter-spacing:-0.02em;">
                <span style="display:inline-block;background:#ffffff;border-radius:6px;width:24px;height:24px;line-height:24px;text-align:center;color:#0066FF;margin-right:8px;vertical-align:middle;font-size:14px;">🎫</span>
                <span style="vertical-align:middle;">Polinema Ticket</span>
            </td>
            <td align="right" style="color:#e0e7ff;font-size:11px;font-weight:600;">
                ${dateString}
            </td>
        </tr>
    </table>
</td></tr>
</table>

<!-- Main Content -->
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
<tr><td align="center" style="padding:32px 16px;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="width:600px;max-width:100%;">
        
        <!-- Hero Card -->
        <tr><td style="background:#eef5ff;border:1px solid #dbeafe;border-radius:16px;padding:32px 24px;text-align:center;">
            <div style="width:40px;height:40px;background:#ffffff;border-radius:12px;display:inline-block;line-height:40px;font-size:20px;margin-bottom:16px;box-shadow:0 2px 4px rgba(0,0,0,0.05)">🎫</div>
            <h1 style="margin:0;font-size:20px;font-weight:700;color:#18181b;line-height:1.4;letter-spacing:-0.02em;">${safeTitle}</h1>
            <div style="margin:12px 0 0;font-size:13px;color:#4b5563;">${opts.metaLine}</div>
        </td></tr>

        <!-- Actions Row -->
        <tr><td style="padding:16px 0;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                    <td width="48%" style="background:#ffffff;border:1px solid #e4e4e7;border-radius:12px;padding:14px;text-align:center;font-size:12px;color:#18181b;font-weight:600;">
                        <span style="color:#71717a">Repo ID:</span> <span style="color:#0066FF">${esc(opts.repo)}${opts.issueNumber ? ` · #${opts.issueNumber}` : ''}</span>
                    </td>
                    <td width="4%"></td>
                    <td width="48%" style="background:#0066FF;border-radius:12px;padding:14px;text-align:center;">
                        <a href="${esc(opts.htmlUrl || '#')}" style="color:#ffffff;font-size:13px;font-weight:700;text-decoration:none;display:block;">${esc(opts.ctaLabel || 'View Issue')}</a>
                    </td>
                </tr>
            </table>
        </td></tr>

        <!-- Details Card -->
        <tr><td style="background:#ffffff;border:1px solid #e4e4e7;border-radius:16px;overflow:hidden;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                    <td style="padding:16px 20px;border-bottom:1px solid #f4f4f5;">
                        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                            <tr>
                                <td align="left" style="font-size:14px;font-weight:700;color:#18181b;">Ticket Details</td>
                                <td align="right">${badgeHtml}</td>
                            </tr>
                        </table>
                    </td>
                </tr>
                <tr>
                    <td style="padding:20px;">
                        ${renderSections(opts.body)}
                    </td>
                </tr>
            </table>
        </td></tr>

        <!-- Footer -->
        <tr><td align="center" style="padding:32px 0 0;">
            <p style="margin:0;font-size:11px;color:#a1a1aa;line-height:1.5;">${esc(opts.footerNote || 'This issue has been closed.')}</p>
            <p style="margin:8px 0 0;font-size:11px;color:#a1a1aa;">Polinema Ticket · <a href="https://ticket.p-ui.deno.net" style="color:#0066FF;text-decoration:none;">ticket.p-ui.deno.net</a> · <a href="mailto:polinema.ui@gmail.com" style="color:#0066FF;text-decoration:none;">polinema.ui@gmail.com</a></p>
        </td></tr>
        
    </table>
</td></tr>
</table>
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
