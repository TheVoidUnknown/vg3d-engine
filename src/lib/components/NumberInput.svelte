<script lang="ts">
  interface Props {
    onChange?: (n: number) => void;

    value: number | undefined;
    scrollable?: boolean;
    label?: string;
    disabled?: boolean;
    min?: number;
    max?: number;
    step?: number;
    shiftStep?: number;
    ctrlStep?: number;
    placeholder?: string;
    tooltip?: string;
    mini?: boolean;
  }

  let {
    onChange,

    value = $bindable(),
    scrollable = true,
    label = undefined,
    disabled = false,
    min = -2e16,
    max = 2e16,
    step = 1,
    shiftStep = 0.1,
    ctrlStep = 0.01,
    placeholder = '0.00',
    tooltip,
    mini = false
  }: Props = $props();

  const inputId = `number-input-${Math.random().toString(36).substring(2, 9)}`;
  const smallestStep = [step, shiftStep, ctrlStep].sort((a, b) => a - b)[0];
  
  let isShiftHeld = $state(false);

  function handleWheel(event: WheelEvent) {
    if (!scrollable || disabled) return;
    event.preventDefault();

    const currentValue = Number(value) || 0;
    let nextValue;

    if (event.deltaY < 0) {
      nextValue = currentValue + (event.ctrlKey ? ctrlStep : isShiftHeld ? shiftStep : step);
    } else {
      nextValue = currentValue - (event.ctrlKey ? ctrlStep : isShiftHeld ? shiftStep : step);
    }

    const clampedValue = Math.max(min, Math.min(max, nextValue));
    
    value = roundToNearest(clampedValue, smallestStep);

    if (onChange) { onChange(value ?? 0); }
  }

  function handleChange() {
    value = value === 0 ? 0 : roundToNearest(value, smallestStep);

    if (onChange) { onChange(value ?? 0); }
  }

  function roundToNearest(number: number | undefined, place: number) {
    if (!number) { return undefined; }
    return Math.round(number / place) * place; 
  }

  function onKeyDown(e: KeyboardEvent) { if (e.key === "Shift") { isShiftHeld = true; } }
  function onKeyUp(e: KeyboardEvent)   { if (e.key === "Shift") { isShiftHeld = false;} }
</script>

<svelte:window onkeydown={onKeyDown} onkeyup={onKeyUp} />

<div class="flex flex-col gap-1 text-left {mini ? `w-full` : "min-w-8"}">
  {#if label || tooltip}
    <span class="flex justify-between items-center">
      {#if label}
        <label
          for={inputId}
          class="block text-zinc-200 mb-1"
        >
          {label}
        </label>
      {/if}
    </span>
  {/if}

  <input
    bind:value
    id={inputId}
    type="number"
    {disabled}
    {placeholder}
    {min}
    {max}
    {step}
    onwheel={handleWheel}
    onchange={handleChange}
    class="w-full rounded-lg bg-zinc-700 px-2 py-1 text-zinc-100 
           focus:outline-none focus:ring-2 focus:ring-amber-600 
           disabled:cursor-not-allowed disabled:opacity-50
           [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none
           {mini ? "text-center" : ""}
    "
  />
</div>