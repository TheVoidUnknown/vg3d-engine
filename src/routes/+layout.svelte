<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
<div class="flex flex-col h-svh justify-between text-slate-100 overflow-hidden">
	<div class="flex flex-col grow justify-between overflow-hidden">
		{@render children()}
	</div>
</div>