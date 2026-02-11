<script lang="ts">
	import type { PerformanceSnapshot } from './commonTypes';

	interface Props {
		smooth?: boolean;
		interval: number; // ms between snapshots
		duration: number; // total window size in seconds to display
		snapshots: PerformanceSnapshot[];
	}

	let { 
		smooth = true, 
		interval, 
		duration, 
		snapshots = []
	}: Props = $props();

	let width = $state(0);
	let height = $state(0);

	type MetricKey = keyof PerformanceSnapshot | 'activeObjs';

	interface MetricConfig {
		key: MetricKey;
		label: string;
		color: string;
		unit?: string;
		getValue: (s: PerformanceSnapshot) => number;
	}

	const METRICS: MetricConfig[] = [
		{ key: 'ups', label: 'UPS', color: '#3b82f6', getValue: s => Number(s.ups) },
		{ key: 'fps', label: 'FPS', color: '#22c55e', getValue: s => Number(s.fps) },
		{ key: 'cpuMs', label: 'CPU', color: '#ef4444', unit: 'ms', getValue: s => Number(s.cpuMs) },
		{ key: 'renderMs', label: 'Render', color: '#eab308', unit: 'ms', getValue: s => Number(s.renderMs) },
		{ key: 'activeObjs', label: 'Objs', color: '#a855f7', getValue: s => s.activeObjs.opaque + s.activeObjs.transparent }
	];

	function getMaxValue(values: number[]): number {
		let max = 0;
		for (let i = 0; i < values.length; i++) {
			if (values[i] > max) max = values[i];
		}
		return max || 1; // Prevent division by zero
	}

	function getSplinePath(points: { x: number; y: number }[]): string {
		if (points.length === 0) return '';
		if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

		let d = `M ${points[0].x} ${points[0].y}`;
		
		for (let i = 0; i < points.length - 1; i++) {
			const p0 = points[i === 0 ? 0 : i - 1];
			const p1 = points[i];
			const p2 = points[i + 1];
			const p3 = points[i + 2] || p2;

			const cp1x = p1.x + (p2.x - p0.x) / 6;
			const cp1y = p1.y + (p2.y - p0.y) / 6;

			const cp2x = p2.x - (p3.x - p1.x) / 6;
			const cp2y = p2.y - (p3.y - p1.y) / 6;

			d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
		}
		return d;
	}

	const visibleSnapshots = $derived.by(() => {
		if (!snapshots.length) return [];
		const maxItems = Math.ceil((duration * 1000) / interval);
		return snapshots.length > maxItems ? snapshots.slice(-maxItems) : snapshots;
	});

	const chartData = $derived.by(() => {
		if (visibleSnapshots.length < 2 || width === 0 || height === 0) return [];

		return METRICS.map((metric) => {
			const values = visibleSnapshots.map(metric.getValue);
			const current = values[values.length - 1] ?? 0;
			const max = getMaxValue(values); 

			const points = values.map((v, i) => ({
				x: (i / (values.length - 1)) * width,
				y: height - (v / max) * height
			}));

			const d = smooth ? getSplinePath(points) : `M ${points.map(p => `${p.x},${p.y}`).join(' L ')}`;

			return {
				...metric,
				d,
				current,
				max
			};
		});
	});
</script>

<div class="flex flex-col h-full w-full gap-3 p-4 bg-zinc-900/80  font-mono">
	
	<!-- Legend -->
	<div class="flex flex-wrap gap-x-5 gap-y-2 shrink-0">
		{#each chartData as metric (metric.key)}
			<div class="flex items-center gap-2 text-xs">
				<div 
					class="w-2.5 h-2.5 rounded-full shadow-[0_0_8px]" 
					style="background-color: {metric.color}; shadow-color: {metric.color}"
				></div>
				
				<div class="flex flex-col leading-none">
					<span class="text-zinc-400 font-medium uppercase tracking-wider text-[10px]">
						{metric.label}
					</span>
					<span class="text-zinc-100 font-mono font-bold mt-0.5">
						{metric.current.toFixed(1)} <span class="text-zinc-500 text-[10px]">{metric.unit ?? ''}</span>
					</span>
				</div>
			</div>
		{:else}
			<div class="text-zinc-500 text-xs italic">Waiting for data...</div>
		{/each}
	</div>

	<!-- Chart Container -->
	<div 
		class="relative grow w-full min-h-12 max-h-12 bg-zinc-950/50 rounded border border-zinc-800/50 overflow-hidden"
		bind:clientWidth={width}
		bind:clientHeight={height}
	>
		<!-- Background Grid -->
		<svg class="absolute inset-0 pointer-events-none w-full h-full opacity-20">
			{#each [0.25, 0.5, 0.75] as y}
				<line x1="0" y1="{y * 100}%" x2="100%" y2="{y * 100}%" stroke="white" stroke-dasharray="2 4" stroke-width="1" />
			{/each}
			<line x1="0" y1="99%" x2="100%" y2="99%" stroke="white" stroke-width="1" />
		</svg>

		<!-- Data Lines -->
		<svg
			{width}
			{height}
			viewBox="0 0 {width} {height}"
			class="absolute inset-0 overflow-visible opacity-75"
			preserveAspectRatio="none"
		>
			{#each chartData as metric (metric.key)}
				<path
					d={metric.d}
					fill="none"
					stroke={metric.color}
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					vector-effect="non-scaling-stroke"
					class="opacity-90 drop-shadow-md transition-all duration-300 ease-linear"
				/>
			{/each}
		</svg>
	</div>
</div>