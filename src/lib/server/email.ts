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

	return nodemailer.createTransport({
		service: 'gmail',
		auth: { user, pass }
	});
};

type MailOpts = { to: string; subject: string; html: string; replyTo?: string };

const sendMail = async (opts: MailOpts) => {
	const transporter = buildTransporter();
	const from = getCentralEmail();
	await transporter.sendMail({ from, to: opts.to, subject: opts.subject, html: opts.html, replyTo: opts.replyTo });
};

const escapeHtml = (s: string) =>
	s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const wrapHtml = (opts: {
	heading: string;
	badge?: string;
	repo: string;
	meta: string;
	body: string;
	htmlUrl?: string;
	footer?: string;
}): string => {
	const badge = opts.badge
		? `<span style="display:inline-block;padding:2px 8px;border-radius:9999px;font-size:10px;font-weight:700;letter-spacing:.04em;background:#18181b;color:#fff;margin-left:8px;vertical-align:middle">${escapeHtml(opts.badge)}</span>`
		: '';
	const linkHtml = opts.htmlUrl
		? `<p style="margin:12px 0 0"><a href="${opts.htmlUrl}" style="color:#2563eb;word-break:break-all">${escapeHtml(opts.htmlUrl)}</a></p>`
		: '';
	const footer = opts.footer || 'Polinema Ticket · polinema.ui@gmail.com';
	return `
		<div style="font-family: ui-sans-serif, system-ui, -apple-system, sans-serif; color: #18181b; line-height: 1.6; max-width: 640px;">
			<h2 style="margin:0 0 8px;font-size:16px;line-height:1.3">${escapeHtml(opts.heading)}${badge}</h2>
			<p style="margin:0;color:#71717a;font-size:12px"><strong>Repository:</strong> polinema-ui/${escapeHtml(opts.repo)}</p>
			<div style="margin:4px 0 0;font-size:12px;color:#71717a">${opts.meta}</div>
			<div style="margin:16px 0;padding:12px 16px;background:#f4f4f5;border-radius:12px;border:1px solid #e4e4e7;white-space:pre-wrap;font-size:13px;word-break:break-word">${escapeHtml(opts.body)}</div>
			${linkHtml}
			<p style="margin-top:16px;font-size:11px;color:#a1a1aa">${escapeHtml(footer)}</p>
		</div>
	`;
};

// backward compat — dipakai POST /api/notify/issue dari modal web
export const sendIssueNotification = async (payload: NotifyPayload) => {
	const maintainers = getMaintainers();
	const to = [...maintainers, payload.reporterEmail].join(', ');
	const html = wrapHtml({
		heading: payload.title,
		repo: payload.repo,
		meta: `<p style="margin:0"><strong>Reporter:</strong> ${escapeHtml(payload.author)} &lt;${escapeHtml(payload.reporterEmail)}&gt;</p>`,
		body: payload.body,
		htmlUrl: payload.htmlUrl
	});
	await sendMail({
		to,
		subject: `[Polinema Ticket] ${payload.title} · ${payload.repo}`,
		html,
		replyTo: payload.reporterEmail
	});
};

// 1) semua activity issue -> polinema.ui@gmail.com (central)
export const notifyCentral = async (opts: {
	title: string;
	body: string;
	repo: string;
	author: string;
	htmlUrl?: string;
	badge: string;
}) => {
	const to = getCentralEmail();
	const html = wrapHtml({
		heading: opts.title,
		badge: opts.badge,
		repo: opts.repo,
		meta: `<p style="margin:0"><strong>By:</strong> ${escapeHtml(opts.author)}</p>`,
		body: opts.body,
		htmlUrl: opts.htmlUrl,
		footer: 'Central inbox · polinema.ui@gmail.com'
	});
	await sendMail({ to, subject: `[${opts.badge}] ${opts.title} · ${opts.repo}`, html, replyTo: getCentralEmail() });
};

// 2) assigned -> hanya ke assignee (rriovld atau rafiabiyyu)
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
	const html = wrapHtml({
		heading: opts.title,
		badge: 'ASSIGNED',
		repo: opts.repo,
		meta: `<p style="margin:0"><strong>Assigned to:</strong> ${escapeHtml(opts.assigneeLogin)} &lt;${escapeHtml(opts.assigneeEmail)}&gt;</p><p style="margin:2px 0 0"><strong>By:</strong> ${escapeHtml(opts.assignedBy)}</p>`,
		body: opts.body,
		htmlUrl: opts.htmlUrl,
		footer: `Kamu di-assign di polinema-ui/${opts.repo} #${opts.issueNumber ?? ''}`
	});
	await sendMail({
		to: opts.assigneeEmail,
		subject: `[Assigned] ${opts.title} → ${opts.assigneeLogin} · ${opts.repo}#${opts.issueNumber ?? ''}`,
		html,
		replyTo: getCentralEmail()
	});
};

// 3) ke requester (yang buka issue/PR) -> notif assigned/comment/closed/merged
export const notifyRequester = async (opts: {
	to: string;
	subject: string;
	heading: string;
	badge: string;
	repo: string;
	meta: string;
	body: string;
	htmlUrl?: string;
}) => {
	const html = wrapHtml({
		heading: opts.heading,
		badge: opts.badge,
		repo: opts.repo,
		meta: opts.meta,
		body: opts.body,
		htmlUrl: opts.htmlUrl,
		footer: 'Polinema Ticket · polinema.ui@gmail.com — balas email ini untuk follow up'
	});
	await sendMail({ to: opts.to, subject: opts.subject, html, replyTo: getCentralEmail() });
};
