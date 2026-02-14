import { parse, formatHex, converter, inGamut, oklch, formatRgb } from 'culori';

export type ColorIndex = number;
export type RawRgb = number[];
export type Rgba = { r: number, g: number, b: number, a?: number, };
export type Hsl = { h?: number, s: number, l: number };
export type Oklch = { l: number, c: number, h?: number };
export type GradientStop = { color: string, pos: number };

export const LUMINANCE_RGB_WEIGHTS = { r: 299, g: 587, b: 114 };
export const ORANGENESS_HUE_ANCHOR = 200;

export class ColorService {

  public static hslFix(hsl: Hsl): Hsl {
    let aH = (hsl.h || 0);
    if (aH > 180) { aH = aH - 180; } else { aH = aH + 180; }

    let aS = hsl.s;
    aS = Math.abs(aS);

    return { h: aH, s: aS, l: hsl.l };
  }

  public static averageLuminance(color: Rgba) {
    const { r, g, b } = color;
    const { r: rW, g: gW, b: bW } = LUMINANCE_RGB_WEIGHTS;

    return ((r*rW)+(g*gW)+(b*bW))/1000;
  }

  public static averageOrangeness(color: Rgba) {
    const { h } = this.rgbaToHsl(color);

    const diff = ((h||0) - ORANGENESS_HUE_ANCHOR + 180) % 360 - 180;
    const distance = diff < -180 ? diff + 360 : diff;

    const score = 1 - Math.abs(distance) / 90;

    return score;
  }

  public static findMaxChroma(l: number, h: number | undefined): number {
    if (h === undefined || l <= 0 || l >= 100) { return 0; }

    const isRgbInGamut = inGamut('rgb');
    let low = 0;
    let high = 0.4;
    const precision = 0.001;

    // Perform a binary search to find the gamut boundary.
    while (high - low > precision) {
      const mid = (low + high) / 2;
      if (isRgbInGamut({ mode: 'oklch', l: l/100, h, c: mid })) {
        low = mid;
      } else {
        high = mid;
      }
    }

    return low*100;
  }

  public static findMinLightness(c: number, h: number | undefined): number {
    if (c <= 0 || h === undefined) { return 0; }

    const isRgbInGamut = inGamut('rgb');
    let low = 0;
    let high = 1;
    const precision = 0.001;

    while (high - low > precision) {
      const mid = (low + high) / 2;
      if (isRgbInGamut({ mode: 'oklch', l: mid, c: c/100, h })) {
        high = mid;
      } else {
        low = mid;
      }
    }

    return high*100
  }

  public static findMaxLightness(c: number, h: number | undefined): number {
    if (c <= 0 || h === undefined) { return 100; }

    const isRgbInGamut = inGamut('rgb');
    let low = 0;
    let high = 1;
    const precision = 0.001;

    while (high - low > precision) {
      const mid = (low + high) / 2;
      if (isRgbInGamut({ mode: 'oklch', l: mid, c: c/100, h })) {
        low = mid;
      } else {
        high = mid;
      }
    }

    return low*100;
  }

  public static rgbGradientStops(): Record<string, GradientStop[]> {
    return { 
      r: [
        {color:`rgba(0,0,0,1)`,pos:0},
        {color:`rgba(255,0,0,1)`,pos:100}
      ],
      g: [
        {color:`rgba(0,0,0,1)`,pos:0},
        {color:`rgba(0,255,0,1)`,pos:100}
      ],
      b: [
        {color:`rgba(0,0,0,1)`,pos:0},
        {color:`rgba(0,0,255,1)`,pos:100}
      ]
    }
  }

  public static hslGradientStops(color: Hsl, precision=20): Record<string, GradientStop[]> {
    return {
      h: [...Array(precision).keys()].map(i => { 
        return {color:`rgba(${Object.values(this.hslToRgba({ 
          h:(i*(360/10)), 
          s:color.s, 
          l:color.l
        })).join(",")})`,pos:i*10} 
      }),
      s: [
        {color:`rgba(${Object.values(this.hslToRgba({ 
          h:color.h, 
          s:0, 
          l:color.l
        })).join(",")})`,pos:0},

        {color:`rgba(${Object.values(this.hslToRgba({ 
          h:color.h, 
          s:1, 
          l:color.l 
        })).join(",")})`,pos:100}
      ],
      l: [
        {color:`rgba(${Object.values(this.hslToRgba({ 
          h:color.h, 
          s:color.s, 
          l:0 
        })).join(",")})`,pos:0},

        {color:`rgba(${Object.values(this.hslToRgba({ 
          h:color.h, 
          s:color.s, 
          l:255 
        })).join(",")})`,pos:100}
      ]
    }
  }

  public static oklchGradientStops(
    color: Oklch,
    hideOutOfGamut = false,
    precision = 50
  ): Record<string, GradientStop[]> {
    const hue = color.h ?? 0;
    const lightness = color.l;
    const chroma = color.c;

    const stops: Record<string, GradientStop[]> = {
      l: [],
      c: [],
      h: [],
    };

    const isInSrgbGamut = inGamut('rgb');
    const toRgb = converter('rgb');

    // Generates the gradient stops for a slider
    const generateStops = (
      getOklchForStep: (step: number) => Oklch
    ): GradientStop[] => {

      // Mode 1: Show out-of-gamut colors
      if (!hideOutOfGamut) {
        const finalStops: GradientStop[] = [];
        for (let i = 0; i < precision; i++) {
          const step = i / (precision - 1);
          const oklchColor = getOklchForStep(step);
          
          // toRgb() clips to the closest sRGB color
          const finalColor = toRgb({ mode: 'oklch', ...oklchColor });

          finalStops.push({
            color: formatRgb(finalColor),
            pos: step * 100,
          });
        }
        return finalStops;
      }

      // Mode 2: Clip out-of-gamut colors with black stops
      const calculatedPoints = Array.from({ length: precision }, (_, i) => {
        const step = i / (precision - 1);
        const oklchColor = getOklchForStep(step);
        return {
          oklch: oklchColor,
          inGamut: isInSrgbGamut(oklch({ mode: 'oklch', ...oklchColor })),
          pos: step * 100,
        };
      });

      const finalStops: GradientStop[] = [];
      const firstPoint = calculatedPoints[0];

      // Add the first stop
      finalStops.push({
        color: firstPoint.inGamut
          ? formatRgb(oklch({ mode: 'oklch', ...firstPoint.oklch }))
          : 'rgba(0,0,0,1)',
        pos: firstPoint.pos,
      });

      // Iterate to find gamut boundaries
      for (let i = 1; i < calculatedPoints.length; i++) {
        const currentPoint = calculatedPoints[i];
        const prevPoint = calculatedPoints[i - 1];

        if (currentPoint.inGamut !== prevPoint.inGamut) {
          const boundaryPos = (currentPoint.pos + prevPoint.pos) / 2;

          if (currentPoint.inGamut) {
            finalStops.push({ color: 'rgba(0,0,0,1)', pos: boundaryPos });
            finalStops.push({
              color: formatRgb(oklch({ mode: 'oklch', ...currentPoint.oklch })),
              pos: boundaryPos,
            });
          } else {
            finalStops.push({
              color: formatRgb(oklch({ mode: 'oklch', ...prevPoint.oklch })),
              pos: boundaryPos,
            });
            finalStops.push({ color: 'rgba(0,0,0,1)', pos: boundaryPos });
          }
        } else if (currentPoint.inGamut) {
          finalStops.push({
            color: formatRgb(oklch({ mode: 'oklch', ...currentPoint.oklch })),
            pos: currentPoint.pos,
          });
        }
      }

      // Ensure the last stop is present if it's out-of-gamut
      const lastPoint = calculatedPoints[precision - 1];
      if (!lastPoint.inGamut) {
        finalStops.push({ color: 'rgba(0,0,0,1)', pos: lastPoint.pos });
      }

      return finalStops;
    };

    // Generate stops
    // Lightness
    stops.l = generateStops((step) => ({
      l: step,
      c: chroma / 100,
      h: hue,
    }));

    // Chroma
    const maxChroma = 0.4;
    stops.c = generateStops((step) => ({
      l: lightness / 100,
      c: step * maxChroma,
      h: hue,
    }));

    // Hue
    stops.h = generateStops((step) => ({
      l: lightness / 100,
      c: chroma / 100,
      h: step * 360,
    }));

    return stops;
  }

  // ===== RAW <-> RGBA =====
  public static rgbaToRaw(rgba: Rgba): RawRgb {
    return [ rgba.r/255, rgba.g/255, rgba.b/255, (rgba.a ?? 1) ];
  }

  public static rawToRgba(raw: RawRgb): Rgba {
    return { r: raw[0]*255, g: raw[1]*255, b: raw[2]*255, a: raw[3] }
  }

  public static hexToRaw(hex: string): RawRgb {
    // Really hacky but im too tired to care
    return this.rgbaToRaw(this.hexToRgba(hex) ?? { r: 0, g: 0, b: 0 });
  }

  // ===== HEX <-> RGBA =====
  public static hexToRgba(hex: string): Rgba | undefined {
    const color = parse(hex);
    if (!color) { return undefined; }

    const toRgb = converter('rgb');
    const { r, g, b } = toRgb(color)

    return { r: r*255, g: g*255, b:b*255 };
  };

  public static rgbaToHex(rgba: Rgba): string {
    const { r, g, b } = rgba;
    return formatHex({ mode: "rgb", r:r/255, g:g/255, b:b/255});
  };

  // ===== OKLCH <-> RGBA =====
  public static oklchToRgba(oklch: Oklch): Rgba {
    const toRgb = converter('rgb');
    const { r, g, b } = toRgb({ mode: "oklch", ...oklch });

    return { r, g, b };
  };

  public static rgbaToOklch(rgba: Rgba): Oklch {
    const toOklch = converter('oklch');
    const { l, c, h } = toOklch({ mode: "rgb", ...rgba });

    return { l, c, h };
  };

  // ===== HSL <-> RGBA =====
  public static hslToRgba(hsl: Hsl): Rgba {
    const toRgb = converter('rgb');
    const { r, g, b } = toRgb({ mode: "hsl", ...hsl });

    return { r, g, b };
  };

  public static rgbaToHsl(rgba: Rgba): Hsl {
    const toHsl = converter('hsl');
    const { h, s , l } = this.hslFix(toHsl({ mode: "rgb", ...rgba }));

    return { h, s, l };
  };

  // ===== HSL <-> OKLCH =====
  public static hslToOklch(hsl: Hsl): Oklch {
    const toOklch = converter('oklch');
    const { l, c, h } = toOklch({ mode: "hsl", ...hsl });

    return { l, c, h };
  };

  public static oklchToHsl(oklch: Oklch): Hsl {
    const toHsl = converter('hsl');
    const { h, s, l } = this.hslFix(toHsl({ mode: "oklch", ...oklch }));

    return { h, s, l };
  };
}