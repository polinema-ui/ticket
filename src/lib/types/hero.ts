import type { IconSvgElement } from './icon.js';

export type HeroCard = {
	id: string;
	title: string;
	icon: IconSvgElement;
	col: number;
	row: number;
	bg: string;
	text: string;
	subtext: string;
	prNumber: number;
	status: 'Open' | 'Merged' | 'Closed' | 'Draft';
	description: string;
	author: string;
	avatarUrl: string;
	authorUrl: string;
	timeAgo: string;
	additions: number;
	deletions: number;
	labels: string[];
};
export type ButtonVariant = 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'link';
export type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';
