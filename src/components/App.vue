<template lang="pug">
.main
  pointer-area.canvas(
    :strokes="drawnStrokes"
    :backgroundImage="backgroundImageURL"
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
      flat-button.button(@click="askBackgroundImage" :disabled='loadingBackgroundImage')
        | {{ loadingBackgroundImage ? 'Loading...' : (backgroundImageURL ? 'Change Background' : 'Select Background') }}
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
import { saveAs } from 'file-saver';
import csvStringifyCb from 'csv-stringify';
import FlatButton from './FlatButton.vue';
import PointerArea from './PointerArea.vue';
import resample from '../resample';

// Use bind as a workaround for an error on safari when applying promisify directly on csvStringify.
const csvStringify = promisify(csvStringifyCb.bind());

export default {
  data: () => ({
    repositoryURL: REPOSITORY_URL,
    version: APP_VERSION,
    name: 'Pointer Logger',
    logInactive: true,
    drawAll: false,
    exportId: 'strokes',
    resamplingRate: 15,
    strokes: [],
    currentStroke: undefined,
    loadingBackgroundImage: false,
    backgroundImageURL: undefined,
    backgroundImageName: undefined
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
      // Create a csv file from the strokes.
      const csvFile = new File(
        [await csvStringify(exportedStrokes, { header: true })],
        `${this.exportId}${resampleStrokes ? '-resampled' : ''}.csv`,
        { type: 'text/csv;charset=utf-8' }
      );
      // Save the file.
      saveAs(csvFile);
    },
    clearStrokes() {
      this.strokes = [];
      this.currentStroke = undefined;
    },
    askBackgroundImage() {
      this.$refs.imageFileInput.click();
    },
    imageFileChange() {
      this.loadingBackgroundImage = true;
      const reader = new FileReader();
      const file = this.$refs.imageFileInput.files[0];
      reader.addEventListener('load', () => {
        this.backgroundImageURL = reader.result;
        this.backgroundImageName = file.name;
        this.loadingBackgroundImage = false;
      }, false);
      reader.addEventListener('error', () => {
        this.loadingBackgroundImage = false;
      });
      reader.readAsDataURL(file);
    },
    onPointerMove(record_) {
      // Append the current background image to the record.
      const record = Object.assign(
        {},
        record_,
        { backgroundImage: this.backgroundImageName }
      );
      if (
        !this.currentStroke ||
        !this.currentStroke.active && record.active
      ) {
        // If there is no ongoing current stroke or this stroke wasn't active while the new record
        // is, create a new stroke.
        this.currentStroke = {
          active: record.active,
          movements: [record]
        };
        this.strokes.push(this.currentStroke);
      } else {
        // Else, push a new record to the current stroke.
        this.currentStroke.movements.push(record);
        if (record.type === 'end' || record.type === 'out') {
          // If the current stroke is done, it is not the current stroke anymore.
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
