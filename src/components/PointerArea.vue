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
  :style="backgroundImage ? { 'background-image': `url('${backgroundImage}')` } : null"
)
  strokes-canvas.canvas(ref="canvas" :strokes="strokes")
</template>

<script>
import createPointerEventRecord from '../pointer-event-record';
import StrokesCanvas from './StrokesCanvas.vue';

export default {
  props: {
    strokes: { type: Array, default: () => [] },
    startTime: { type: Number },
    backgroundImage: { type: String }
  },
  data: () => ({
    active: false
  }),
  methods: {
    onPointerEvent(evt) {
      const record = createPointerEventRecord(
        evt,
        this.active,
        this.$refs.canvas.rect
      );
      this.active = record.active;
      this.$emit('move', record);
    }
  },
  components: { StrokesCanvas }
};
</script>

<style lang="scss" scoped>
.pointer-area {
  display: flex;
  background-position: center;
  background-repeat: no-repeat;
  background-size: contain;
}
.canvas {
  flex-grow: 1;
}
</style>
