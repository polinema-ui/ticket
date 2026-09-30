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
	html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" style="color:#0066ff;text-decoration:underline;word-break:break-all">$1</a>');
	html = html.replace(/(?<!href=")(https?:\/\/[^\s<]+)/g, '<a href="$1" style="color:#0066ff;text-decoration:underline;word-break:break-all">$1</a>');
	return html;
};

const renderInlineBody = (raw: string): string => {
	const trimmed = raw.trim();
	if (!trimmed) return '<span style="color:#94a3b8;font-style:italic">—</span>';
	const parts = trimmed.split(/```/);
	let out = '';
	for (let i = 0; i < parts.length; i++) {
		if (i % 2 === 1) {
			const code = esc(parts[i].replace(/^\w*\n/, '')).trim();
			out += `<pre style="margin:10px 0 0;padding:12px 14px;background:#1e293b;color:#f8fafc;border-radius:10px;font-family:ui-monospace, SFMono-Regular, Menlo, monospace;font-size:12px;line-height:1.5;white-space:pre-wrap;word-break:break-word;overflow-wrap:anywhere">${code}</pre>`;
		} else {
			const text = parts[i].trim();
			if (!text) continue;
			const paras = text.split(/\n{2,}/);
			for (const p of paras) {
				const linked = linkify(p);
				const withBreaks = linked.replace(/\n/g, '<br/>');
				out += `<p style="margin:0 0 10px;font-size:13px;line-height:1.65;color:#334155">${withBreaks}</p>`;
			}
		}
	}
	return out || '<span style="color:#94a3b8;font-style:italic">—</span>';
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
		return `<div style="padding:6px 0">${renderInlineBody(body)}</div>`;
	}
	let html = '';
	for (const sec of visible) {
		const label = esc(sec.label);
		const isEmpty = !sec.content || sec.content === '```text\n\n```' || sec.content.replace(/[`\s]/g, '') === '';
		html += `
			<div style="padding:14px 16px;border-bottom:1px solid #f1f5f9">
				<div style="margin:0 0 6px;font-family:'Plus Jakarta Sans',ui-sans-serif,system-ui,sans-serif;font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#64748b">${label}</div>
				<div>${isEmpty ? '<span style="color:#cbd5e1;font-size:12px;font-style:italic">Not provided</span>' : renderInlineBody(sec.content)}</div>
			</div>`;
	}
	html = html.replace(/border-bottom:1px solid #f1f5f9"$/, 'border-bottom:none"');
	return html;
};

const badgeStyle = (badge: string): string => {
	const b = badge.toLowerCase();
	if (b.includes('assigned')) return 'background:#0066ff;color:#ffffff';
	if (b.includes('merged')) return 'background:#16a34a;color:#ffffff';
	if (b.includes('closed')) return 'background:#dc2626;color:#ffffff';
	if (b.includes('comment')) return 'background:#ea580c;color:#ffffff';
	if (b.includes('opened')) return 'background:#2563eb;color:#ffffff';
	return 'background:#0066ff;color:#ffffff';
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
		? `<span style="display:inline-block;padding:3px 12px;border-radius:9999px;font-family:'Plus Jakarta Sans',ui-sans-serif,system-ui,sans-serif;font-size:11px;font-weight:700;letter-spacing:.05em;${badgeStyle(opts.badge)}">${esc(opts.badge)}</span>`
		: '';
	const repoPill = `<span style="font-family:'Plus Jakarta Sans',ui-sans-serif,system-ui,sans-serif;font-size:12px;font-weight:600;color:#0066ff">polinema-ui/${esc(opts.repo)}${opts.issueNumber ? ` · #${opts.issueNumber}` : ''}</span>`;
	const safeTitle = esc(opts.title).replace(/"/g, '&quot;');
	const nowFormatted = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

	return `<!doctype html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>
</head>
<body style="margin:0;padding:0;background:#eef2f6;font-family:'Plus Jakarta Sans',ui-sans-serif,system-ui,sans-serif">
<div style="background:#eef2f6;padding:0 0 32px 0">

<!-- 1. Top Header Bar (Solid Blue Basis Style) -->
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#0066ff">
	<tr><td align="center" style="padding:16px 20px">
		<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="width:600px;max-width:100%">
			<tr>
				<td align="left" style="vertical-align:middle">
					<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
						<td style="vertical-align:middle">
							<img src="https://raw.githubusercontent.com/polinema-ui/ticket/main/src/lib/assets/logo.png" width="30" height="30" alt="Polinema Ticket Logo" style="display:block;border-radius:8px;background:#ffffff;padding:2px" />
						</td>
						<td style="padding-left:10px;vertical-align:middle">
							<span style="font-family:'Plus Jakarta Sans',ui-sans-serif,system-ui,sans-serif;font-weight:800;font-size:18px;letter-spacing:-.03em;color:#ffffff">Polinema Ticket</span>
						</td>
					</tr></table>
				</td>
				<td align="right" style="vertical-align:middle">
					<span style="font-family:'Plus Jakarta Sans',ui-sans-serif,system-ui,sans-serif;font-size:12px;font-weight:500;color:rgba(255,255,255,0.85)">${nowFormatted}</span>
				</td>
			</tr>
		</table>
	</td></tr>
</table>

<!-- Main Wrapper -->
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:24px">
<tr><td align="center" style="padding:0 16px">
	<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="width:600px;max-width:100%">
		
		<!-- 2. Hero Header Banner (Gradient Card with Floating White Icon Box) -->
		<tr><td style="padding-bottom:16px">
			<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:linear-gradient(180deg, #edf5ff 0%, #dbeafe 100%);border:1px solid #bfdbfe;border-radius:24px;text-align:center;overflow:hidden">
				<tr><td align="center" style="padding:28px 24px 24px">
					<!-- Floating Icon Box -->
					<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 16px"><tr>
						<td style="width:52px;height:52px;background:#ffffff;border-radius:14px;box-shadow:0 10px 25px -5px rgba(0,102,255,0.15);text-align:center;vertical-align:middle">
							<img src="https://raw.githubusercontent.com/polinema-ui/ticket/main/src/lib/assets/logo.png" width="28" height="28" alt="Logo" style="display:inline-block;vertical-align:middle;margin:0 auto" />
						</td>
					</tr></table>
					<h1 style="margin:0 0 10px;font-family:'Plus Jakarta Sans',ui-sans-serif,system-ui,sans-serif;font-size:20px;line-height:1.35;font-weight:800;color:#0f172a;letter-spacing:-.03em">${safeTitle}</h1>
					<div style="margin:0;font-family:'Plus Jakarta Sans',ui-sans-serif,system-ui,sans-serif;font-size:12px;line-height:1.6;color:#475569;max-width:500px;margin:0 auto">${opts.metaLine}</div>
				</td></tr>
			</table>
		</td></tr>

		<!-- 3. Quick Action Bar / Meta Cards (Dual Cards) -->
		<tr><td style="padding-bottom:20px">
			<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
				<tr>
					<td width="60%" style="vertical-align:middle;padding-right:8px">
						<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;padding:12px 16px">
							<tr>
								<td style="vertical-align:middle;width:24px">
									<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0066ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M6 6h10"/><path d="M6 10h10"/></svg>
								</td>
								<td style="vertical-align:middle;padding-left:8px">
									<span style="font-family:'Plus Jakarta Sans',ui-sans-serif,system-ui,sans-serif;font-size:12px;font-weight:700;color:#1e293b">Repo ID:</span>
									<span style="font-family:'Plus Jakarta Sans',ui-sans-serif,system-ui,sans-serif;font-size:12px;font-weight:600;color:#0066ff;margin-left:4px">${repoPill}</span>
								</td>
							</tr>
						</table>
					</td>
					<td width="40%" style="vertical-align:middle;padding-left:8px">
						${
							opts.htmlUrl
								? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr><td align="right">
									<a href="${esc(opts.htmlUrl)}" style="display:block;width:100%;text-align:center;padding:12px 0;background:#0066ff;color:#ffffff;border-radius:14px;font-family:'Plus Jakarta Sans',ui-sans-serif,system-ui,sans-serif;font-size:13px;font-weight:700;text-decoration:none;box-shadow:0 4px 12px rgba(0,102,255,0.25)">${esc(opts.ctaLabel || 'View on GitHub')}</a>
								</td></tr></table>`
								: `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr><td align="right" style="background:#f1f5f9;border:1px solid #e2e8f0;border-radius:14px;padding:12px 16px;text-align:center">
									<span style="font-size:12px;font-weight:700;color:#64748b">${badgeHtml}</span>
								</td></tr></table>`
						}
					</td>
				</tr>
			</table>
		</td></tr>

		<!-- 4. Main Details Card (Rounded White Card inside Soft Gray Wrapper) -->
		<tr><td>
			<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#ffffff;border:1px solid #e2e8f0;border-radius:24px;overflow:hidden;box-shadow:0 4px 20px -5px rgba(0,0,0,0.03)">
				<tr><td style="padding:18px 20px 14px;border-bottom:1px solid #f1f5f9;background:#f8fafc">
					<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
						<tr>
							<td align="left" style="vertical-align:middle">
								<span style="font-family:'Plus Jakarta Sans',ui-sans-serif,system-ui,sans-serif;font-size:14px;font-weight:800;color:#0f172a;letter-spacing:-.01em">Ticket Details</span>
							</td>
							<td align="right" style="vertical-align:middle">
								${badgeHtml}
							</td>
						</tr>
					</table>
				</td></tr>
				<tr><td style="padding:12px 8px 16px">
					${renderSections(opts.body)}
				</td></tr>
			</table>
		</td></tr>

		<!-- 5. Footer -->
		<tr><td align="center" style="padding:24px 12px 12px">
			<p style="margin:0;font-family:'Plus Jakarta Sans',ui-sans-serif,system-ui,sans-serif;font-size:11px;line-height:1.6;color:#94a3b8">${esc(opts.footerNote || 'You are receiving this notification from Polinema UI Ticket System.')}</p>
			<p style="margin:8px 0 0;font-family:'Plus Jakarta Sans',ui-sans-serif,system-ui,sans-serif;font-size:11px;color:#94a3b8">Polinema Ticket · <a href="https://ticket.p-ui.deno.net" style="color:#0066ff;text-decoration:none;font-weight:600">ticket.p-ui.deno.net</a> · polinema.ui@gmail.com</p>
		</td></tr>

	</table>
</td></tr>
</table>

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
		metaLine: `Reporter · <span style="font-weight:600;color:#1e293b">${esc(payload.author)}</span> &lt;${esc(payload.reporterEmail)}&gt;`,
		body: payload.body,
		htmlUrl: payload.htmlUrl,
		ctaLabel: payload.htmlUrl ? 'View Issue →' : undefined,
		footerNote: 'This ticket was created via Polinema Ticket. Maintainers have been notified.'
	});
	await sendMail({ to: [...getMaintainers(), payload.reporterEmail].join(', '), subject: `[Polinema Ticket] ${payload.title} · ${payload.repo}`, html, replyTo: payload.reporterEmail });
};

export const notifyCentral = async (opts: { title: string; body: string; repo: string; author: string; htmlUrl?: string; badge: string; issueNumber?: number }) => {
	const html = baseTemplate({
		badge: opts.badge,
		title: opts.title,
		repo: opts.repo,
		issueNumber: opts.issueNumber,
		metaLine: `Activity by <span style="font-weight:700;color:#0f172a">${esc(opts.author)}</span> · Central Inbox`,
		body: opts.body,
		htmlUrl: opts.htmlUrl,
		ctaLabel: 'View on GitHub',
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
		metaLine: `Assigned to <span style="font-weight:700;color:#0f172a">${esc(opts.assigneeLogin)}</span> by <span style="font-weight:600;color:#334155">${esc(opts.assignedBy)}</span>`,
		body: opts.body,
		htmlUrl: opts.htmlUrl,
		ctaLabel: 'View Assignment',
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
	meta: string;
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
		ctaLabel: 'View Update',
		footerNote: 'You received this notification because you opened this issue/PR.'
	});
	await sendMail({ to: opts.to, subject: opts.subject, html, replyTo: getCentralEmail() });
};
