<template lang="pug">
.main
  pointer-area.canvas(
    :strokes="drawnStrokes"
    :backgroundImage="image"
    @move="onPointerMove"
  )
  .footer
    .info
      h1.title
        | {{ name }}
        |
      span.version
        | {{ version ? ` v${version}` : '' }}
      a.github-link(
        v-if="repositoryURL"
        :href="repositoryURL"
        title="Github repository of the project"
      )
        img.github-logo(src="./github.svg" alt="github")
    .controls
      flat-button.button(@click="askImage" :disabled='loadingImage')
        | {{ loadingImage ? 'Loading...' : (image ? 'Change Background' : 'Select Background') }}
      flat-button.button(@click="clearStrokes" :disabled='empty')
        | Clear
      flat-button.button(@click="exportStrokes(false)" :disabled='empty')
        | Export
      flat-button.button(@click="exportStrokes(true)" :disabled='empty')
        | Export resampled
    input.hidden-file-input(
      type='file'
      ref="imageFileInput"
      :multiple="false"
      accept="image/*"
      @change.prevent="imageFileChange"
    )
</template>

<script>
/* global APP_VERSION, REPOSITORY_URL */

import promisify from 'util.promisify';
import download from 'downloadjs';
import csvStringifyCb from 'csv-stringify';
import FlatButton from './FlatButton.vue';
import PointerArea from './PointerArea.vue';
import resample from '../resample';

// Use bind as a workaround for an error on safari when applying promisify directly on csvStringify.
const csvStringify = promisify(csvStringifyCb.bind());

export default {
  data: () => ({
    strokes: [],
    currentStroke: undefined,
    drawAll: false,
    logInactive: true,
    version: APP_VERSION,
    repositoryURL: REPOSITORY_URL,
    name: 'Pointer Logger',
    loadingImage: false,
    image: undefined,
    resamplingRate: 15
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
    async exportStrokes(resampleStrokes = false) {
      // Concat the record movements of all strokes.
      const movements = (
        this.logInactive
          ? this.strokes
          : this.strokes.filter(s => s.active)
      )
        .map(s => s.movements)
        .reduce((acc, stroke) => acc.concat(stroke));

      const exportedStrokes = (
        // Resample if needed.
        resampleStrokes
          ? resample(movements, this.resamplingRate)
          : movements
      )
        // Add the logger informations.
        .map(r => Object.assign(
          {},
          r,
          { logger: this.name, loggerVersion: this.version }
        ));
      // Convert the strokes to csv.
      const csvStr = await csvStringify(exportedStrokes, { header: true });
      // Trigger the "download".
      download(csvStr, 'pointer.csv', 'text/csv');
    },
    clearStrokes() {
      this.strokes = [];
      this.currentStroke = undefined;
    },
    askImage() {
      this.$refs.imageFileInput.click();
    },
    imageFileChange() {
      this.loadingImage = true;
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        this.image = reader.result;
        this.loadingImage = false;
      }, false);
      reader.addEventListener('error', () => {
        this.loadingImage = false;
      });
      reader.readAsDataURL(this.$refs.imageFileInput.files[0]);
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
$footer-bg: #D9D7D9;
$footer-shadow-color: rgba(0, 0, 0, .4);
// $footer-border-color: ;
$logo-height: 1.4em;
$info-title-opacity: .5;
$version-opacity: .5;
$info-github-opacity: .25;
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
    background-color: $footer-bg;
    bottom: 0;
    box-shadow: 0px 0px 0px 1px $footer-shadow-color;
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
      font: 1em 'Open Sans', sans-serif;
      margin: 0 .2em;
      font-weight: bolder;
      opacity: $info-title-opacity;
    }

    .version {
      font-size: .9em;
      opacity: $version-opacity;
    }

    .github-link {
      display: block;
      padding: 0;
      margin: 0 1em;
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
  }

  .controls {
    display: flex;
  }

  .hidden-file-input {
    display: none;
  }

  @media(max-width: 750px) {
    .info {
      align-self: flex-end;

      .github-link,
      .version {
        display: none;
      }

      .title {
        font-size: .7em;
      }
    }
  }

  @media(max-width: 550px) {
    .info {
      display: none;
    }
    .footer {
      justify-content: center;
    }
  }
}
</style>
