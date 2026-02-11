<script lang="ts">
	import type { PerformanceSnapshot } from "$lib/components/commonTypes";
	import PerformanceGraph from "$lib/components/PerformanceGraph.svelte";
	import VgdFileUpload from "$lib/components/VgdFileUpload.svelte";
	import NumberInput from "$lib/components/NumberInput.svelte";
	import Scrubber from "$lib/components/Scrubber.svelte";
	import Checkbox from "$lib/components/Checkbox.svelte";
  import { onDestroy, onMount } from "svelte";
	import { base } from "$app/paths";

  import VgdConverterService from "$lib/engine/services/VgdConverterService";
	import RuntimeService from "$lib/engine/services/RuntimeService";
  import Editor from "$lib/engine/core/editor/Editor";
  import initRegistries from "$lib";
	import type { ITheme } from "$lib/engine/core/level/Level.types";
	import type { IVgdLevel } from "$lib/engine/vgd/Vgd.types";

  let ANIMATION_DURATION = $state(180); // Seconds
  let SNAPSHOT_INTERVAL = $state(500); // Milliseconds

  let editor: Editor | null = $state(null);
  let canvas: HTMLCanvasElement | null = null;
  let updateLoopId: number;

  // Performance Counters
  let _updates = 0;
  let _frames = 0;
  let _cpuTimeSum = 0;
  let _renderTimeSum = 0;
  let _lastMetricUpdate = 0;

  // Metrics
  let uiTime = $state(0);
  let activeObjs = $state({ opaque: 0, transparent: 0 });
  let activeTheme: ITheme | null = $state(null);
  let snapshots: PerformanceSnapshot[] = $state([]);
  let converterStats = $derived(VgdConverterService.stats);

  // Controls
  let time = $state(0);
  let isPlaying = $state(false);
  let isPerspective = $state(true);
  let _lastUpdate = 0;

  onMount(() => {
    initRegistries();
    editor = canvas ? new Editor(null, canvas) : new Editor();
    updateLoopId = requestAnimationFrame(updateLoop);
  });

  onDestroy(() => {
    if (editor && !editor.isHeadless) { 
      editor.renderer.dispose();
      editor = null;
    }
  });

  function updateTime() {
    if (isPlaying) {
      const now = performance.now();
      time += (now - _lastUpdate) / 1000;
      _lastUpdate = now;
    } else {
      _lastUpdate = performance.now();
    }
  }

  function updateLoop() {
    if (!editor) { return; }
    updateTime();

    // Schedule next frame ASAP, we got frames to per second!
    updateLoopId = requestAnimationFrame(updateLoop);

    // Update the animations
    const tUpdateStart = performance.now();
    editor.update(time);
    _cpuTimeSum += (performance.now() - tUpdateStart);
    _updates++;

    // Update UI
    isPerspective = editor.cameraType == "perspective";
    activeTheme = editor._theme;

    // Render the frame
    const tFrameStart = performance.now();
    editor.render();
    _renderTimeSum += (performance.now() - tFrameStart);
    _frames++;

    // Update metrics
    if (_lastUpdate - _lastMetricUpdate > SNAPSHOT_INTERVAL && isPlaying) { updateMetrics(tFrameStart, time); }
  }

  function updateMetrics(now: number, currentTime: number) {
    const elapsedMs = now - _lastMetricUpdate;
    
    const ups = Math.round((_updates * 1000) / elapsedMs);
    const fps = Math.round((_frames * 1000) / elapsedMs);
    const cpuMs = _frames > 0 ? _cpuTimeSum / _frames : 0;
    const renderMs = _updates > 0 ? _renderTimeSum / _updates : 0;
    uiTime = currentTime;

    activeObjs = { opaque: 0, transparent: 0 };
    RuntimeService.opaqueBatches.forEach((b) => { activeObjs.opaque += b.size });
    RuntimeService.transparentBatches.forEach((b) => { activeObjs.transparent += b.size });

    const index = Math.floor((time * 1000) / SNAPSHOT_INTERVAL);
    const snapshot = { ups, fps, cpuMs, renderMs, activeObjs };

    if (snapshots[index]) {
      snapshots[index] = snapshot;
    } else {
      snapshots.push(snapshot);
    }

    _updates = 0;
    _frames = 0;
    _cpuTimeSum = 0;
    _renderTimeSum = 0;
    _lastMetricUpdate = now;
  }

  function handleUpload(data: string) {
    if (!editor) { alert("The editor has not loaded yet!"); return; }

    try {
      console.info("Loading level...");

      const vgdLevel = JSON.parse(data) as IVgdLevel;
      const level = VgdConverterService.levelFromVgd(vgdLevel);
      editor.level = level;
      // Cap at 5 minutes because people like to set autokill times to 999
      ANIMATION_DURATION = Math.min(editor.getEndTime(), 300);

      console.info(`Done! (${VgdConverterService.stats.conversionTime}ms)`);

      converterStats = VgdConverterService.stats;

      snapshots = [];
      isPlaying = true;
    } catch (oops) {
      const stack = oops as unknown as { stack: string };
      alert(`There was an error parsing this level! Please report this!\n\nError: ${oops}\n\nStack: ${stack ?? "N/A"}`)
    }
  }

  function onkeydown(e: KeyboardEvent) {
    if (e.code == "Space") { isPlaying = !isPlaying; }
  }
</script>

<svelte:window
  {onkeydown}
></svelte:window>

<main class="max-w-screen max-h-screen flex flex-col gap-2">

  <section class="relative w-full bg-zinc-900/50 font-mono z-50 pointer-events-none">
    <!-- This is known to be laggy sometimes. Ironic, I know. -->
    <PerformanceGraph 
      {snapshots}
      interval={SNAPSHOT_INTERVAL}
      duration={ANIMATION_DURATION}
    />
  </section>

  <div class="flex grow">
    <!-- Left control panel -->
    <section class="flex flex-col justify-between basis-1/3 p-4 gap-4">
        {#if editor}
          <div class="flex flex-col gap-4">

            <!-- File upload -->
            <div class="w-full flex flex-col gap-2 mb-4">
              <div class="w-full flex gap-4">
                <VgdFileUpload onUpload={handleUpload} />
              </div>

              {#if converterStats}
                <span class="text-white/50 text-sm">
                  Parsed {converterStats.objects} objects in {converterStats.conversionTime}ms
                </span>
              {/if}
            </div>

            <!-- Freecam toggles -->
            <div class="flex gap-4">
              <Checkbox label="Perspective" isChecked={isPerspective} onClick={() => editor!.setCameraType("perspective")} />
              <Checkbox label="Freecam" isChecked={true} onClick={() => editor!.toggleFreecam() }/>
            </div>

            <div class="flex gap-4">
              <Checkbox label="Orthographic" isChecked={!isPerspective} onClick={() => editor!.setCameraType("orthographic")} />
            </div>

          </div>

          <div class="flex flex-col gap-4">
            <!-- Freecam movement -->
            <div class="flex gap-4">
              <NumberInput value={0}   shiftStep={0.1} step={1} ctrlStep={10} onChange={(n) => editor!.freecamPos.x = n} label="Camera X"/>
              <NumberInput value={0}   shiftStep={0.1} step={1} ctrlStep={10} onChange={(n) => editor!.freecamPos.y = n} label="Camera Y"/>
              <NumberInput value={100} shiftStep={0.1} step={1} ctrlStep={10} onChange={(n) => editor!.freecamPos.z = n} label="Camera Z"/>
              <NumberInput value={45}  shiftStep={0.1} step={1} ctrlStep={10} onChange={(n) => editor!.freecamFov   = n} label="FoV"/>
            </div>

            <!-- Freecam target -->
            <div class="flex gap-4">
              <NumberInput value={0} shiftStep={0.1} step={1} ctrlStep={10} onChange={(n) => editor!.freecamTarget.x = n} label="Target X"/>
              <NumberInput value={0} shiftStep={0.1} step={1} ctrlStep={10} onChange={(n) => editor!.freecamTarget.y = n} label="Target Y"/>
              <NumberInput value={0} shiftStep={0.1} step={1} ctrlStep={10} onChange={(n) => editor!.freecamTarget.z = n} label="Target Z"/>
            </div>

            <!-- Theme display -->
            <div class="flex gap-2 justify-center">
              {#if activeTheme !== null}
                {#each activeTheme.objects as color}
                  <div class="w-8 h-8" style="background-color: rgb({color.r}, {color.g}, {color.b});"></div>
                {/each}
              {/if}
            </div>

        </div>
      {/if}
    </section>

    <!-- Right canvas -->
    <section class="flex w-full flex-1 min-h-0">
      <div
        class="w-full border-2 border-zinc-900 bg-black overflow-hidden"
        style="aspect-ratio:16/9;"
      >
        <canvas bind:this={canvas} class="w-full h-full block"></canvas>
      </div>
    </section>
  </div>

  <!-- Scrubber & Playback -->
  <section class="flex w-full gap-4">
    <button
      onclick={() => isPlaying = !isPlaying}
      style="background-image: url({base}/icons/{isPlaying ? "pause.png" : "play.png"});"

      aria-label="Play / Pause"
      class="
        flex justify-center p-1 w-9 h-9
        bg-zinc-700 rounded-md font-bold
        hover:bg-amber-700 active:bg-amber-600
        active:scale-95
        transition-all duration-150

        bg-contain bg-no-repeat bg-origin-content 
      "
    ></button>

    <svg
      class="w-full h-9 bg-zinc-900"
    >
      <Scrubber
        bind:timestamp={time}
        duration={ANIMATION_DURATION}
        timeToPx={(t) => { console.log(t); return t; }}
        pxToTime={(p) => { console.log(p); return p; }}
      />
    </svg>
  </section>
</main>