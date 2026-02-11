<script lang="ts">
  interface Props {
    isChecked?: boolean;

    label?: string;
    tooltip?: string;
    disabled?: boolean;
    
    onClick?: () => void;
  }

  let {
    isChecked = $bindable(),

    label,
    tooltip,
    disabled,

    onClick
  }: Props = $props();

  const inputId = `number-input-${Math.random().toString(36).substring(2, 9)}`;

  function handleClick() {
    if (disabled) { return; }
    isChecked = !isChecked;
    if (onClick) { onClick(); }
  }
</script>

<div class="flex gap-4 text-left w-full items-center">
  <input
    bind:checked={isChecked}
    id={inputId}
    type="checkbox"
    {disabled}
    class="hidden"
  />

  <button
    aria-label={inputId}
    onclick={handleClick}
    class={`
      relative border-2 w-6 h-6 rounded-md transition-colors duration-150 
      ${disabled ? "cursor-not-allowed" : "cursor-pointer"}
      ${isChecked ? "border-amber-600" : "border-zinc-700"}
    `}
  >
    <span 
      class="absolute transition-all duration-50 bg-amber-600 rounded-sm top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 {isChecked ? "w-4 h-4" : "w-0 h-0"}"
    ></span>
  </button>

  {#if label || tooltip}
    <span class="flex justify-between items-center select-none gap-2">
      {#if label}
        <label
          for={inputId}
          class={`
            block text-zinc-200
            ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}
          `}
        >
          {label}
        </label>
      {/if}
    </span>
  {/if}
</div>