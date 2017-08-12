<template lang="pug">
.main
  pointer-area.canvas(:strokes="drawnStrokes" @move="onPointerMove")
  .footer
    .info
      h1.title
        | Pointer Logger
        |
        span.version
          | {{ version ? ` v${version}` : '' }}
      a.github-link(
        href="https://github.com/QuentinRoy/Track-Recorder"
        title="Github repository of the project"
      )
        img.github-logo(src="./github.svg" alt="github")
    .controls
      flat-button.button(@click="clearTrack" :disabled='empty')
        | Clear
      flat-button.button(@click="exportTrack" :disabled='empty')
        | Export
</template>

<script>
/* global APP_VERSION */

import promisify from 'util.promisify';
import download from 'downloadjs';
import csvStringifyCb from 'csv-stringify';
import FlatButton from './FlatButton.vue';
import PointerArea from './PointerArea.vue';

// Use bind as a workaround for an error on safari when applying promisify directly on csvStringify.
const csvStringify = promisify(csvStringifyCb.bind());

export default {
  data: () => ({
    strokes: [],
    currentStroke: undefined,
    drawAll: false,
    logInactive: true,
    version: APP_VERSION
  }),
  computed: {
    empty() {
      return !this.strokes.length ||
        (!this.logInactive && this.strokes.every(s => !s.active));
    },
    drawnStrokes() {
      if (this.empty) return [];
      if (this.drawAll) {
        return this.strokes;
      }
      return this.currentStroke ? [this.currentStroke] : [];
    }
  },
  methods: {
    async exportTrack() {
      // Concat the record movements of all strokes.
      const movements = (
        this.logInactive
          ? this.strokes
          : this.strokes.filter(s => s.active)
      )
        .map(s => s.movements)
        .reduce((acc, stroke) => acc.concat(stroke));
      // Convert them to csv.
      const csvStr = await csvStringify(movements, { header: true });
      // Trigger the "download".
      download(csvStr, 'track.csv', 'text/csv');
    },
    clearTrack() {
      this.strokes = [];
      this.currentStroke = undefined;
    },
    onPointerMove(record) {
      if (
        !this.currentStroke ||
        !this.currentStroke.active && record.active
      ) {
        this.currentStroke = {
          active: record.active,
          movements: [record]
        };
        this.strokes.push(this.currentStroke);
      } else {
        this.currentStroke.movements.push(record);
        if (record.type === 'end' || record.type === 'out') {
          this.currentStroke = undefined;
        }
      }
    }
  },
  components: { FlatButton, PointerArea }
};
</script>

<style lang="scss" scoped>
$controls-bg: #C7C5C5;
$shadow-color: rgba(0, 0, 0, .3);
$controls-title-color: darken($controls-bg, 30%);

$logo-height: 1.4em;
$info-title-opacity: .7;
$info-github-opacity: .5;
$info-hovered-github-opacity: $info-title-opacity;

.main {
  height: 100%;
  display: flex;
  flex-direction: column;

  .canvas {
    flex-grow: 1;
  }

  .footer {
    align-items: center;
    background-color: $controls-bg;
    bottom: 0;
    box-shadow: 0 0 8px -2px $shadow-color;
    box-sizing: border-box;
    display: flex;
    justify-content: space-between;
    padding: 5px;
    width: 100%;
  }

  .info {
    display: flex;
    align-items: center;

    .title {
      font: small-caps bolder 1em 'Open Sans', sans-serif;
      font-variant: small-caps;
      margin: 0 .2em;
      opacity: $info-title-opacity;
    }

    .github-link {
      display: block;
      padding: 0;
      margin: .5em .2em;
      text-decoration: none;
      height: $logo-height;
      opacity: $info-github-opacity;

      .github-logo {
        margin: 0;
        height: 100%;
      }

      &:hover {
        opacity: $info-hovered-github-opacity;
      }
    }

    @media(max-width: 380px) {
      align-self: flex-end;

      .github-link {
        display: none;
      }

      .title {
        font-size: .7em;
        .version {
          display: none;
        }
      }
    }
  }

  .controls {
    .button {
      margin: 0 .2em;
    }
  }
}
</style>
