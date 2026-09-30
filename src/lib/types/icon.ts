export type IconTuple = readonly [string, Record<string, string | number>];
export type IconSvgElement = readonly IconTuple[];

export type HugeIconProps = {
	icon: IconSvgElement;
	size?: number | string;
	color?: string;
	strokeWidth?: number;
	class?: string;
};
