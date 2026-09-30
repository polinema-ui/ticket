export type NavLink = { label: string; href: `/#${string}` | '/'; plus?: boolean };

export const NAV_LINKS: readonly NavLink[] = [
	{ label: 'Features', href: '/#features' },
	{ label: 'Workflow', href: '/#workflow' },
	{ label: 'Integrations', href: '/#integrations', plus: true },
	{ label: 'Pricing', href: '/#pricing' },
	{ label: 'Docs', href: '/#docs' }
] as const;
