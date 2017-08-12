<template lang="pug">
canvas.canvas(ref="canvas")
</template>

<script>
import rafThrottle from 'raf-throttle';

const devicePixelRatio = window.devicePixelRatio || 1;

export default {
  props: {
    strokes: { type: Array, default: () => [] }
  },
  data: () => ({
    rect: undefined
  }),
  mounted() {
    // Set up resize.
    window.addEventListener('resize', this.setUpCanvasSize);
    // Set up the size and repaint.
    this.setUpCanvasSize();
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.setUpCanvasSize);
  },
  methods: {
    setUpCanvasSize: rafThrottle(function setUpCanvasSize() {
      // Clear style and width.
      this.$refs.canvas.width = '';
      this.$refs.canvas.height = '';
      if (devicePixelRatio !== 1) {
        this.$refs.canvas.style.width = '';
        this.$refs.canvas.style.height = '';
      }
      // Recalculate expected size (force reflow).
      this.rect = this.$refs.canvas.getBoundingClientRect();
      // Set up canvas with and height accordingly to its display size.
      this.$refs.canvas.width = this.rect.width * devicePixelRatio;
      this.$refs.canvas.height = this.rect.height * devicePixelRatio;
      // Adjust back the canvas width and height if it has changed.
      if (devicePixelRatio !== 1) {
        this.$refs.canvas.style.width = `${this.rect.width}px`;
        this.$refs.canvas.style.height = `${this.rect.height}px`;
      }
      // Init the paint.
      this.repaintNow();
      this.$emit('resize', this.rect);
    }),
    repaint: rafThrottle(function repaint() {
      this.repaintNow();
    }),
    repaintNow() {
      const ctx = this.$refs.canvas.getContext('2d');
      ctx.save();

      // Set up context parameters.
      ctx.scale(devicePixelRatio, devicePixelRatio);
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.lineWidth = 2;

      // Clear the canvas.
      ctx.clearRect(0, 0, this.rect.width, this.rect.height);

      // Draw the strokes.
      ctx.beginPath();
      this.strokes.forEach((e, i) => {
        if (e.type === 'start' || e.type === 'in' || i === 0) {
          ctx.moveTo(e.x, this.rect.height - e.y);
        } else if (e.active && e.type === 'move' || e.type === 'end' && e.x != null) {
          ctx.lineTo(e.x, this.rect.height - e.y);
        }
      });
      ctx.stroke();
      ctx.restore();
    }
  },
  watch: {
    strokes() {
      this.repaint();
    }
  }
};
</script>
