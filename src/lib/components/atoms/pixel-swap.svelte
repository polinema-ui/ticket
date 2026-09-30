<script lang="ts">
	import { onMount } from 'svelte';

	let {
		title = 'Polinema Ticket',
		bgColor = '#2563eb',
		pixelSize = 58,
		duration = 1400,
		pixelDuration = 360,
		active = false,
		onComplete
	}: {
		title?: string;
		bgColor?: string;
		pixelSize?: number;
		duration?: number;
		pixelDuration?: number;
		active?: boolean;
		onComplete?: () => void;
	} = $props();

	let canvasEl: HTMLCanvasElement | undefined = $state(undefined);
	let visible = $state(true);

	const makeEasing = (x1: number, y1: number, x2: number, y2: number) => {
		const cx = 3 * x1;
		const bx = 3 * (x2 - x1) - cx;
		const ax = 1 - cx - bx;
		const cy = 3 * y1;
		const by = 3 * (y2 - y1) - cy;
		const ay = 1 - cy - by;
		return (progress: number) => {
			let t = progress;
			for (let i = 0; i < 5; i++) {
				const slope = (3 * ax * t + 2 * bx) * t + cx;
				if (!slope) break;
				t -= (((ax * t + bx) * t + cx) * t - progress) / slope;
			}
			t = Math.max(0, Math.min(1, t));
			return ((ay * t + by) * t + cy) * t;
		};
	};

	const ease = makeEasing(0.22, 1, 0.36, 1);

	const noise = (seed: number): number => {
		const val = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
		return val - Math.floor(val);
	};

	type Tile = {
		x: number;
		y: number;
		w: number;
		h: number;
		delay: number;
	};

	let startAnimation: (() => void) | undefined;

	onMount(() => {
		const canvas = canvasEl;
		if (!canvas) return;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
			visible = false;
			onComplete?.();
			return;
		}

		const offscreen = document.createElement('canvas');
		const oCtx = offscreen.getContext('2d');
		if (!oCtx) return;

		let dpr = Math.min(window.devicePixelRatio || 1, 2);
		let W = window.innerWidth;
		let H = window.innerHeight;

		canvas.width = Math.round(W * dpr);
		canvas.height = Math.round(H * dpr);
		canvas.style.width = `${W}px`;
		canvas.style.height = `${H}px`;

		offscreen.width = canvas.width;
		offscreen.height = canvas.height;

		const renderOffscreen = () => {
			oCtx.save();
			oCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

			oCtx.fillStyle = bgColor;
			oCtx.fillRect(0, 0, W, H);

			const centerX = W / 2;
			const centerY = H / 2;

			oCtx.font =
				'bold 28px "Plus Jakarta Sans", ui-sans-serif, system-ui, -apple-system, sans-serif';
			oCtx.fillStyle = '#ffffff';
			oCtx.textAlign = 'center';
			oCtx.textBaseline = 'middle';
			oCtx.fillText(title, centerX, centerY);

			oCtx.restore();

			ctx.clearRect(0, 0, canvas.width, canvas.height);
			ctx.drawImage(offscreen, 0, 0);
		};

		renderOffscreen();

		if (document.fonts) {
			document.fonts.ready.then(() => renderOffscreen());
		}

		const size = W < 640 ? Math.max(42, pixelSize - 14) : pixelSize;
		const cols = Math.ceil(W / size);
		const rows = Math.ceil(H / size);
		const spread = Math.max(0, duration - pixelDuration);
		const tiles: Tile[] = [];

		for (let r = 0; r < rows; r++) {
			for (let c = 0; c < cols; c++) {
				const id = r * cols + c;
				const rand = noise(id + 1);
				const delay = rand * spread;
				const tileW = Math.min(size, W - c * size);
				const tileH = Math.min(size, H - r * size);
				tiles.push({
					x: c * size,
					y: r * size,
					w: tileW,
					h: tileH,
					delay
				});
			}
		}

		let rafId = 0;
		let startTime = 0;
		let running = false;

		const tick = (now: number) => {
			if (!startTime) startTime = now;
			const elapsed = now - startTime;

			ctx.clearRect(0, 0, canvas.width, canvas.height);

			let allDone = true;

			for (let i = 0; i < tiles.length; i++) {
				const t = tiles[i];
				const tileElapsed = elapsed - t.delay;

				if (tileElapsed < 0) {
					ctx.drawImage(
						offscreen,
						t.x * dpr,
						t.y * dpr,
						t.w * dpr,
						t.h * dpr,
						t.x * dpr,
						t.y * dpr,
						t.w * dpr,
						t.h * dpr
					);
					allDone = false;
				} else if (tileElapsed < pixelDuration) {
					const progress = ease(tileElapsed / pixelDuration);
					const scale = 1 - progress;

					const curW = t.w * scale;
					const curH = t.h * scale;
					const curX = t.x + (t.w - curW) / 2;
					const curY = t.y + (t.h - curH) / 2;

					ctx.globalAlpha = 1 - progress;
					ctx.drawImage(
						offscreen,
						t.x * dpr,
						t.y * dpr,
						t.w * dpr,
						t.h * dpr,
						curX * dpr,
						curY * dpr,
						curW * dpr,
						curH * dpr
					);
					ctx.globalAlpha = 1;
					allDone = false;
				}
			}

			if (allDone) {
				visible = false;
				onComplete?.();
				return;
			}

			rafId = requestAnimationFrame(tick);
		};

		startAnimation = () => {
			if (running) return;
			running = true;
			rafId = requestAnimationFrame(tick);
		};

		return () => {
			if (rafId) cancelAnimationFrame(rafId);
		};
	});

	$effect(() => {
		if (active && startAnimation) {
			startAnimation();
		}
	});
</script>

{#if visible}
	<div class="pointer-events-none fixed inset-0 z-9999 h-screen w-screen overflow-hidden">
		<canvas bind:this={canvasEl} class="block h-full w-full"></canvas>
	</div>
{/if}
