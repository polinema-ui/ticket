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

const buildTransporter = () => {
	const user = env.GMAIL_USER || 'polinema.ui@gmail.com';
	const pass = env.GMAIL_APP_PASSWORD;
	if (!pass) throw new Error('Missing GMAIL_APP_PASSWORD');

	return nodemailer.createTransport({
		service: 'gmail',
		auth: { user, pass }
	});
};

export const sendIssueNotification = async (payload: NotifyPayload) => {
	const transporter = buildTransporter();
	const from = env.GMAIL_USER || 'polinema.ui@gmail.com';
	const maintainers = getMaintainers();

	const reporterHtml = `<p><strong>Reporter:</strong> ${payload.author} &lt;${payload.reporterEmail}&gt;</p>`;
	const repoHtml = `<p><strong>Repository:</strong> polinema-ui/${payload.repo}</p>`;
	const linkHtml = payload.htmlUrl
		? `<p><a href="${payload.htmlUrl}" style="color:#2563eb">${payload.htmlUrl}</a></p>`
		: '';

	const html = `
		<div style="font-family: ui-sans-serif, system-ui, -apple-system, sans-serif; color: #18181b; line-height: 1.6;">
			<h2 style="margin: 0 0 8px; font-size: 16px;">${payload.title}</h2>
			${repoHtml}
			${reporterHtml}
			<div style="margin: 16px 0; padding: 12px 16px; background: #f4f4f5; border-radius: 12px; border: 1px solid #e4e4e7; white-space: pre-wrap; font-size: 13px;">${payload.body}</div>
			${linkHtml}
			<p style="margin-top: 16px; font-size: 12px; color: #71717a;">Polinema Ticket · polinema.ui@gmail.com</p>
		</div>
	`;

	const to = [...maintainers, payload.reporterEmail].join(', ');

	await transporter.sendMail({
		from,
		to,
		subject: `[Polinema Ticket] ${payload.title} · ${payload.repo}`,
		html,
		replyTo: payload.reporterEmail
	});
};
