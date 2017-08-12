<template lang="pug">
div.pointer-area(
  @mousedown.prevent="onPointerEvent"
  @mousemove.prevent="onPointerEvent"
  @mouseup.prevent="onPointerEvent"
  @mouseout.prevent="onPointerEvent"
  @touchstart.prevent="onPointerEvent"
  @touchmove.prevent="onPointerEvent"
  @touchend.prevent="onPointerEvent"
  @touchcancel.prevent="onPointerEvent"
)
  track-canvas.canvas(ref="canvas" :track="track")
</template>

<script>
import createPointerEventRecord from '../pointer-event-record';
import TrackCanvas from './TrackCanvas.vue';

export default {
  props: {
    track: { type: Array, default: () => [] },
    startTime: { type: Number }
  },
  data: () => ({
    active: false
  }),
  methods: {
    onPointerEvent(evt) {
      const wasActive = this.active;
      this.active =
        (evt.type === 'mousedown') ||
        (evt.type === 'mousemove' && this.active) ||
        (evt.type.startsWith('touch') && evt.touches.length > 0);
      if (this.active || wasActive) {
        const record = createPointerEventRecord(evt, this.$refs.canvas.rect);
        this.$emit('drag', record);
      }
    }
  },
  components: { TrackCanvas }
};
</script>

<style lang="scss" scoped>
.pointer-area {
  display: flex;
}

.canvas {
  flex-grow: 1;
}
</style>
