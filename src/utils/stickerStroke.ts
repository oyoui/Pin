/**
 * Sticker Stroke Generator
 * Produces crisp outlines for transparent PNG stickers both in Canvas and DOM
 */

/**
 * Draws an image with an outline stroke onto a target Canvas context.
 * Uses silhouette dilation technique:
 * 1. Creates a colored alpha silhouette of the image.
 * 2. Draws the silhouette at radial offsets forming the outline.
 * 3. Draws the original crisp image on top.
 */
export function drawImageWithStroke(
  ctx: CanvasRenderingContext2D,
  img: CanvasImageSource,
  dx: number,
  dy: number,
  dw: number,
  dh: number,
  strokeWidth: number,
  strokeColor: string,
  isFlippedX = false
) {
  ctx.save();

  if (isFlippedX) {
    ctx.translate(dx + dw, dy);
    ctx.scale(-1, 1);
    dx = 0;
    dy = 0;
  }

  if (strokeWidth <= 0) {
    ctx.drawImage(img, dx, dy, dw, dh);
    ctx.restore();
    return;
  }

  // Create offscreen silhouette of the sticker in the strokeColor
  const offscreen = document.createElement('canvas');
  offscreen.width = Math.ceil(dw);
  offscreen.height = Math.ceil(dh);
  const octx = offscreen.getContext('2d');

  if (!octx) {
    ctx.drawImage(img, dx, dy, dw, dh);
    ctx.restore();
    return;
  }

  // Draw scaled image
  octx.drawImage(img, 0, 0, dw, dh);
  // Color the non-transparent pixels with strokeColor
  octx.globalCompositeOperation = 'source-in';
  octx.fillStyle = strokeColor;
  octx.fillRect(0, 0, dw, dh);

  // Draw outline by scattering the silhouette in a circle
  // Increase angle steps based on strokeWidth for smoothness
  const steps = Math.max(16, Math.min(64, Math.round(strokeWidth * 4)));
  const angleStep = (Math.PI * 2) / steps;

  // We can do multi-ring stamping for thicker strokes so there are no gaps
  const ringCount = Math.max(1, Math.ceil(strokeWidth / 2));
  for (let ring = 1; ring <= ringCount; ring++) {
    const currentRadius = (strokeWidth * ring) / ringCount;
    for (let i = 0; i < steps; i++) {
      const angle = i * angleStep;
      const ox = Math.cos(angle) * currentRadius;
      const oy = Math.sin(angle) * currentRadius;
      ctx.drawImage(offscreen, dx + ox, dy + oy);
    }
  }

  // Now draw original image on top
  ctx.drawImage(img, dx, dy, dw, dh);

  ctx.restore();
}

/**
 * Generates an SVG filter ID and XML string for DOM-based preview of transparent PNG outline
 */
export function getSvgStrokeFilter(filterId: string, strokeWidth: number, strokeColor: string) {
  if (strokeWidth <= 0) return null;
  return `
    <filter id="${filterId}" x="-50%" y="-50%" width="200%" height="200%">
      <feMorphology in="SourceAlpha" result="dilated" operator="dilate" radius="${strokeWidth}" />
      <feFlood flood-color="${strokeColor}" result="flood" />
      <feComposite in="flood" in2="dilated" operator="in" result="stroke" />
      <feMerge>
        <feMergeNode in="stroke" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  `;
}
