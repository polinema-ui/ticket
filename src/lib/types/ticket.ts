export type IssueStatus = 'Open' | 'In Progress' | 'Review' | 'Planned' | 'Closed';

export type IssueLabel = {
	name: string;
	bg: string;
	text: string;
	border?: string;
};

export type IssueItem = {
	id: string | number;
	number: number;
	title: string;
	description: string;
	state: 'open' | 'closed';
	status: IssueStatus;
	labels: IssueLabel[];
	commentsCount: number;
	author: {
		name: string;
		avatar: string;
	};
	timeAgo: string;
	assignee?: {
		name: string;
		avatar: string;
	};
	htmlUrl: string;
	isPr: boolean;
	repo: string;
	milestone?: string;
};

export type IssueTemplate = {
	id: string;
	title: string;
	description: string;
	type: 'issue' | 'doc' | 'security' | 'discussion' | 'feature' | 'course';
	targetUrl?: string;
	icon: 'arrow' | 'shield' | 'external';
};

export type TicketStatus = 'open' | 'in-progress' | 'review' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TicketCategory = 'bug' | 'feature' | 'enhancement' | 'question';

export type Ticket = {
	id: string;
	ticketNumber: number;
	title: string;
	description: string;
	status: TicketStatus;
	priority: TicketPriority;
	category: TicketCategory;
	author: string;
	authorAvatar: string;
	assignee?: string;
	assigneeAvatar?: string;
	githubPrUrl?: string;
	githubIssueUrl?: string;
	createdAt: string;
	updatedAt: string;
	commentsCount: number;
	labels: string[];
};

export type CreateTicketInput = {
	title: string;
	description: string;
	category: TicketCategory;
	priority: TicketPriority;
	author: string;
	email: string;
	githubPrUrl?: string;
};
