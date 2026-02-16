<script>
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<style>
		html, body, #svelte {
			margin: 0;
			padding: 0;
			width: 100%;
			height: 100%;
			font-family: system-ui, sans-serif;
			background-color: #ffffff;
			color: #333333;

        	overflow: hidden;
			display: flex;
			
		}
		* {
			box-sizing: border-box;
		}
	</style>
</svelte:head>

{@render children()}
