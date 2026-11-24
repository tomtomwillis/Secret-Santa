// A simple canvas spinning wheel with a fixed pointer at the top.

const COLOURS = ['#c0392b', '#1e7a4c', '#d4a017', '#2c5d8f'];
const POINTER_ANGLE = -Math.PI / 2; // top of the circle
const TAU = Math.PI * 2;

export class Wheel {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {string[]} names
   */
  constructor(canvas, names) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.names = names;
    this.seg = TAU / names.length;
    this.rotation = Math.random() * TAU;
    this.colours = names.map((_, i) => COLOURS[i % COLOURS.length]);
    // Avoid two neighbouring slices sharing a colour where the wheel wraps round.
    const last = names.length - 1;
    if (last > 0 && this.colours[last] === this.colours[0]) {
      this.colours[last] = COLOURS.find((col) => col !== this.colours[0] && col !== this.colours[last - 1]);
    }
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    const size = this.canvas.clientWidth;
    if (size < 40) return; // hidden or not laid out yet
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = this.canvas.height = Math.round(size * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.size = size;
    this.render();
  }

  render() {
    const { ctx, size, names, seg } = this;
    const c = size / 2;
    const r = c - 6;
    ctx.clearRect(0, 0, size, size);

    names.forEach((name, i) => {
      const start = this.rotation + i * seg;
      ctx.beginPath();
      ctx.moveTo(c, c);
      ctx.arc(c, c, r, start, start + seg);
      ctx.closePath();
      ctx.fillStyle = this.colours[i];
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Name along the middle of the slice; flipped on the left half so it's never upside down.
      const mid = start + seg / 2;
      const leftHalf = Math.cos(mid) < 0;
      ctx.save();
      ctx.translate(c, c);
      ctx.rotate(leftHalf ? mid + Math.PI : mid);
      ctx.fillStyle = '#fff';
      ctx.textAlign = leftHalf ? 'left' : 'right';
      ctx.textBaseline = 'middle';
      const fontSize = Math.max(11, Math.min(18, size / 22));
      ctx.font = `600 ${fontSize}px system-ui, sans-serif`;
      ctx.fillText(fit(ctx, name, r * 0.68), leftHalf ? -(r - 14) : r - 14, 0);
      ctx.restore();
    });

    // Centre hub.
    ctx.beginPath();
    ctx.arc(c, c, size * 0.06, 0, TAU);
    ctx.fillStyle = '#fff';
    ctx.fill();

    // Pointer at the top.
    ctx.beginPath();
    ctx.moveTo(c - 14, 0);
    ctx.lineTo(c + 14, 0);
    ctx.lineTo(c, 30);
    ctx.closePath();
    ctx.fillStyle = '#222';
    ctx.fill();
  }

  /**
   * Spin so the pointer lands on names[index].
   * @param {number} index
   * @param {{ duration?: number, instant?: boolean }} opts
   * @returns {Promise<void>}
   */
  spinTo(index, { duration = 4500, instant = false } = {}) {
    // Land somewhere inside the slice (not always dead centre), away from the edges.
    const jitter = (Math.random() - 0.5) * this.seg * 0.6;
    const target = POINTER_ANGLE - (index + 0.5) * this.seg + jitter;
    const delta = (((target - this.rotation) % TAU) + TAU) % TAU;

    if (instant) {
      this.rotation += delta;
      this.render();
      return Promise.resolve();
    }

    const startRot = this.rotation;
    const total = delta + TAU * 5; // five full turns, then settle on the name
    const t0 = performance.now();
    return new Promise((resolve) => {
      const frame = (now) => {
        const p = Math.min(1, (now - t0) / duration);
        const eased = 1 - Math.pow(1 - p, 4); // ease-out
        this.rotation = startRot + total * eased;
        this.render();
        if (p < 1) requestAnimationFrame(frame);
        else resolve();
      };
      requestAnimationFrame(frame);
    });
  }
}

function fit(ctx, text, maxWidth) {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(t + '…').width > maxWidth) t = t.slice(0, -1);
  return t + '…';
}
