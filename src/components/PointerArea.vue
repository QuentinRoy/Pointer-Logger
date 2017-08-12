<template lang="pug">
div.pointer-area(
  @mousedown.prevent="onPointerEvent"
  @mousemove.prevent="onPointerEvent"
  @mouseup.prevent="onPointerEvent"
  @mouseout.prevent="onPointerEvent"
  @mouseover.prevent="onPointerEvent"
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
      const record = createPointerEventRecord(evt, this.$refs.canvas.rect);
      this.active = record.active;
      this.$emit('move', record);
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
