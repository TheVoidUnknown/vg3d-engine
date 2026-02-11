<script lang="ts">
	interface Props {
		onUpload: (data: string) => void;

    label?: string;
	}

	let { 
    onUpload,
    label = 'Upload VGD'
  }: Props = $props();

	let fileInput: HTMLInputElement;

	async function handleFileChange(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];

		if (file) {
			try {
				const text = await file.text();
				onUpload(text);
				target.value = '';
			} catch (error) {
				throw new Error(`Error reading .vgd file: ${error}`);
			}
		}
	}
</script>

<button
  class="
    flex grow justify-center p-1 px-2
    bg-zinc-700 rounded-md font-bold
    hover:bg-amber-700 active:bg-amber-600
    active:scale-95
    transition-all duration-150
  "
  onclick={() => fileInput.click()}
>
	{label}
</button>

<input
	bind:this={fileInput}
	type="file"
	accept=".vgd"
	onchange={handleFileChange}
	style="display: none;"
/>