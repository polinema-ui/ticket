import type { IssueTemplate } from '@/lib/types/ticket.js';

export const BUG_REPORT_TEMPLATE = `### Describe the Bug
A clear and concise description of what the bug is.

### Steps to Reproduce
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

### Expected Behavior
A clear and concise description of what you expected to happen.

### Screenshots or Screen Recording
If applicable, add screenshots or recordings to help explain your problem.

### Environment & Device
- OS: [e.g. Windows 11, macOS, Ubuntu]
- Browser: [e.g. Chrome, Zen, Safari]
- Version: [e.g. 0.0.1]`;

export const COMPONENT_REQUEST_TEMPLATE = `### Component Name
e.g. DataTable, DateRangePicker, Timeline, CommandPalette

### Problem or Use Case
Describe the practical use case or problem this component solves in Polinema UI.

### Proposed API & Usage Example
Provide a short snippet of how the component should be imported and used.

### References or Design Inspiration
Links or screenshots of similar components from other design systems.

### Accessibility Considerations
Any special ARIA patterns or keyboard navigation requirements.`;

export const DOCS_ISSUE_TEMPLATE = `### Documentation Page
URL or section path where you found an issue.

### Issue Description
What is inaccurate, missing, or unclear in the documentation?

### Suggested Improvement
How can we make this explanation clearer or more helpful?`;

export const DEFAULT_TEMPLATES: (IssueTemplate & {
	bodyTemplate: string;
	label: string;
	defaultTitle: string;
})[] = [
	{
		id: 'bug',
		title: 'Report an issue',
		description: 'Report a Polinema issue or bug.',
		type: 'issue',
		icon: 'arrow',
		defaultTitle: '[BUG] ',
		label: 'bug',
		bodyTemplate: BUG_REPORT_TEMPLATE
	},
	{
		id: 'component',
		title: 'Polinema UI component request',
		description: 'Suggest a new UI component for the design system.',
		type: 'feature',
		icon: 'arrow',
		defaultTitle: '[COMPONENT] ',
		label: 'component',
		bodyTemplate: COMPONENT_REQUEST_TEMPLATE
	},
	{
		id: 'docs',
		title: 'Report a documentation issue',
		description: 'Report an issue with the Polinema documentation.',
		type: 'doc',
		icon: 'arrow',
		defaultTitle: '[DOCS] ',
		label: 'documentation',
		bodyTemplate: DOCS_ISSUE_TEMPLATE
	},
	{
		id: 'security',
		title: 'Report a security vulnerability',
		description: 'Please review our security policy for more details',
		type: 'security',
		targetUrl: 'https://github.com/polinema-ui/.github/security/policy',
		icon: 'shield',
		defaultTitle: '[SECURITY] ',
		label: 'security',
		bodyTemplate: ''
	},
	{
		id: 'discussions',
		title: 'Ask a question or discuss a topic',
		description: 'Ask questions or discuss with other Polinema users in discussions.',
		type: 'discussion',
		targetUrl: 'https://github.com/orgs/polinema-ui/discussions',
		icon: 'external',
		defaultTitle: '',
		label: 'question',
		bodyTemplate: ''
	},
	{
		id: 'feature',
		title: 'Feature or documentation request',
		description: 'Open a feature or documentation request in discussions.',
		type: 'feature',
		targetUrl: 'https://github.com/orgs/polinema-ui/discussions/new?category=ideas',
		icon: 'external',
		defaultTitle: '',
		label: 'enhancement',
		bodyTemplate: ''
	}
];

export const buildGithubIssueUrl = (
	repo: string,
	title: string,
	body: string,
	label?: string
): string => {
	const params = new URLSearchParams();
	if (title) params.set('title', title);
	if (body) params.set('body', body);
	if (label) params.set('labels', label);
	return `https://github.com/polinema-ui/${repo}/issues/new?${params.toString()}`;
};
