<script lang="ts">
  interface Props {
    timestamp: number;
    duration: number;
    timeToPx: (t: number) => number;
    pxToTime: (t: number) => number;
    
    highlighted?: boolean,
    width?: number;
    trackHeight?: number;
  }

  let {
    timestamp = $bindable(0),
    duration = Infinity,

    width = 10,
  }: Props = $props();

  let container: HTMLElement;
  let dragging = false;

  function startDrag(e: MouseEvent) {
    dragging = true;
    window.addEventListener("mousemove", onDrag);
    window.addEventListener("mouseup", stopDrag);
  }

  function onDrag(e: MouseEvent) {
    if (dragging && container) {
      const rect = container.getClientRects().item(0);
      if (!rect?.width) { return; }
      timestamp = (e.offsetX / rect.width) * duration;
    }
  }

  function stopDrag() {
    dragging = false;
    window.removeEventListener("mousemove", onDrag);
    window.removeEventListener("mouseup", stopDrag);
  }
</script>

<!-- fuck you TS i know what im doing -->
<g bind:this={container} data-draggable=true data-disable-drag=true >
  <rect
    y={0}
    height="100%"
    width="100%"
    fill="transparent"
    role="button"
    tabindex="-7"
    onmousedown={startDrag}
    style="cursor:ew-resize;clip-path: polygon(100% 0, 100% 100%, 0% 100%, 0% 0%, 0 0);"
  />

  <rect
    x="{(timestamp / duration) * 100}%"
    y="0"
    width={width}
    height="100%"
    fill="oklch(66.6% 0.179 58.318)"
    role="button"
    tabindex="-7"
    onmousedown={startDrag}
    style="cursor:ew-resize;clip-path: polygon(100% 0, 100% 100%, 0% 100%, 0% 0%, 0 0);"
  />
</g>
