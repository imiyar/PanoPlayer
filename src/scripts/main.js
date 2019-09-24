import videojs from 'video.js';
import PanoCanvas from './PanoCanvas';
import MessageBox from './MessageBox';
import ReturnButton from './ReturnButton';
import Detector from './Detector';
import { clamp } from './Util';
import '../styles/panoplayer.css';

// Default options for the plugin.
const defaults = {
  initFov: 75,
  initLon: 0,
  initLat: 0,

  maxFov: 100,
  minFov: 50,
  minLat: -85,
  maxLat: 85,
  minLon: -Infinity,
  maxLon: Infinity,

  returnStepLat: 1,
  returnStepLon: 1,
  returnStepFov: 1,

  autoBackToDefault: !Detector.isMobile,
  isIOS: Detector.isIos,

  callback: null,
};

const messages = {
  webGLError: 'Your video will be played as a normal video.',
  dragAndDrop: 'Please drag and drop the video',
};

const Plugin = videojs.getPlugin('plugin');

class PanoPlayer extends Plugin {
  constructor(player, options) {
    // the parent class will add player under this.player
    super(player);
    this.isReady = false;

    // Merge default settings and customized settings
    this.options = videojs.mergeOptions(defaults, options);
    this.options.initLat = clamp(this.options.initLat, this.options.minLat, this.options.maxLat);
    this.options.initLon = clamp(this.options.initLon, this.options.minLon, this.options.maxLon);
    this.options.initFov = clamp(this.options.initFov, this.options.minFov, this.options.maxFov);

    // Register customized components with videojs
    const Component = videojs.getComponent('Component');
    videojs.registerComponent('PanoCanvas', videojs.extend(Component, PanoCanvas(Component, this)));
    videojs.registerComponent('MessageBox', videojs.extend(Component, MessageBox(Component, this)));

    const Button = videojs.getComponent('Button');
    videojs.registerComponent('ReturnButton', videojs.extend(Button, ReturnButton(Button, this)));

    // Callback function when videojs is ready
    this.player.ready(() => {
      this.player.addClass('vjs-pano-player');
      this.player.playsinline(true);

      // Check WebGL support
      if (!Detector.webgl) {
        this.messageBox = this.player.addChild('MessageBox', {
          message: `${Detector.getWebGLErrorMessage()}\n${messages.webGLError}`,
          autoFadeOut: false,
          hideOnPlay: true,
        });
      } else {
        // Add customized components to the player
        const controlBar = this.player.getChild('ControlBar');
        this.returnButton = controlBar.addChild('ReturnButton', {}, controlBar.children().length - 1);

        this.messageBox = this.player.addChild('MessageBox', {
          message: messages.dragAndDrop,
          autoFadeOut: true,
          hideOnPlay: false,
        });

        this.panoCanvas = this.player.addChild('PanoCanvas');

        // Do not support picture-in-picture mode
        const pip = controlBar.getChild('PictureInPictureToggle');
        if (pip) {
          controlBar.removeChild(pip);
        }
      }

      if (this.options.callback && typeof this.options.callback === 'function') {
        this.options.callback();
      }

      this.isReady = true;
      this.trigger('ready');
    });
  }

  init(pos) {
    if (pos === undefined) {
      return {
        lat: this.options.initLat,
        lon: this.options.initLon,
        fov: this.options.initFov,
      };
    }
    if (typeof pos === 'object') {
      if (typeof pos.lat === 'number') {
        this.options.initLat = clamp(pos.lat, this.options.minLat, this.options.maxLat);
      }
      if (typeof pos.lon === 'number') {
        this.options.initLon = clamp(pos.lon, this.options.minLon, this.options.maxLon);
      }
      if (typeof pos.fov === 'number') {
        this.options.initFov = clamp(pos.fov, this.options.minFov, this.options.maxFov);
      }
    }
    return this;
  }

  default(pos) {
    if (pos === undefined) {
      return {
        lat: this.panoCanvas.defaultLat,
        lon: this.panoCanvas.defaultLon,
        fov: this.panoCanvas.defaultFov,
      };
    }
    if (typeof pos === 'object') {
      if (typeof pos.lat === 'number') {
        this.panoCanvas.defaultLat = clamp(pos.lat, this.options.minLat, this.options.maxLat);
      }
      if (typeof pos.lon === 'number') {
        this.panoCanvas.defaultLon = clamp(pos.lon, this.options.minLon, this.options.maxLon);
      }
      if (typeof pos.fov === 'number') {
        this.panoCanvas.defaultFov = clamp(pos.fov, this.options.minFov, this.options.maxFov);
      }
    }
    return this;
  }

  current(pos) {
    if (pos === undefined) {
      return {
        lat: this.panoCanvas.lat,
        lon: this.panoCanvas.lon,
        fov: this.panoCanvas.camera.fov,
      };
    }
    if (typeof pos === 'object') {
      if (typeof pos.lat === 'number') {
        this.panoCanvas.lat = clamp(pos.lat, this.options.minLat, this.options.maxLat);
        this.panoCanvas.update();
      }
      if (typeof pos.lon === 'number') {
        this.panoCanvas.lon = clamp(pos.lon, this.options.minLon, this.options.maxLon);
        this.panoCanvas.update();
      }
      if (typeof pos.fov === 'number') {
        this.panoCanvas.camera.fov = clamp(pos.fov, this.options.minFov, this.options.maxFov);
        this.panoCanvas.camera.updateProjectionMatrix();
      }
    }
    return this;
  }

  max(pos) {
    if (pos === undefined) {
      return {
        lat: this.options.maxLat,
        lon: this.options.maxLon,
        fov: this.options.maxLov,
      };
    }
    if (typeof pos === 'object') {
      if (typeof pos.lat === 'number') {
        if (pos.lat < this.options.minLat) {
          throw (new Error('Maximum latitude is smaller than minimum latitude.'));
        }
        this.options.maxLat = pos.lat;
        if (this.panoCanvas.lat > pos.lat) {
          this.current({ lat: pos.lat });
        }
        if (this.panoCanvas.defaultLat > pos.lat) {
          this.default({ lat: pos.lat });
        }
      }
      if (typeof pos.lon === 'number') {
        if (pos.lon < this.options.minLon) {
          throw (new Error('Maximum longitude is smaller than minimum longitude.'));
        }
        this.options.maxLon = pos.lon;
        if (this.panoCanvas.lon > pos.lon) {
          this.current({ lon: pos.lon });
        }
        if (this.panoCanvas.defaultLon > pos.lon) {
          this.default({ lon: pos.lon });
        }
      }
      if (typeof pos.fov === 'number') {
        if (pos.fov < this.options.minFov) {
          throw (new Error('Maximum FoV is smaller than minimum FoV.'));
        }
        this.options.maxFov = pos.fov;
        if (this.panoCanvas.camera.fov > pos.fov) {
          this.current({ fov: pos.fov });
        }
        if (this.panoCanvas.defaultFov > pos.fov) {
          this.default({ fov: pos.fov });
        }
      }
    }
    return this;
  }

  min(pos) {
    if (pos === undefined) {
      return {
        lat: this.options.minLat,
        lon: this.options.minLon,
        fov: this.options.minLov,
      };
    }
    if (typeof pos === 'object') {
      if (typeof pos.lat === 'number') {
        if (pos.lat > this.options.maxLat) {
          throw (new Error('Minimum latitude is larger than maximum latitude.'));
        }
        this.options.minLat = pos.lat;
        if (this.panoCanvas.lat < pos.lat) {
          this.current({ lat: pos.lat });
        }
        if (this.panoCanvas.defaultLat < pos.lat) {
          this.default({ lat: pos.lat });
        }
      }
      if (typeof pos.lon === 'number') {
        if (pos.lon > this.options.maxLon) {
          throw (new Error('Minimum longitude is larger than maximum longitude.'));
        }
        this.options.minLon = pos.lon;
        if (this.panoCanvas.lon < pos.lon) {
          this.current({ lon: pos.lon });
        }
        if (this.panoCanvas.defaultLon < pos.lon) {
          this.default({ lon: pos.lon });
        }
      }
      if (typeof pos.fov === 'number') {
        if (pos.fov > this.options.maxFov) {
          throw (new Error('Minimum FoV is larger than maximum Fov.'));
        }
        this.options.minFov = pos.fov;
        if (this.panoCanvas.camera.fov < pos.fov) {
          this.current({ fov: pos.fov });
        }
        if (this.panoCanvas.defaultFov < pos.fov) {
          this.default({ fov: pos.fov });
        }
      }
    }
    return this;
  }

  returnStep(pos) {
    if (pos === undefined) {
      return {
        lat: this.options.returnStepLat,
        lon: this.options.returnStepLon,
        fov: this.options.returnStepLov,
      };
    }
    if (typeof pos === 'object') {
      if (typeof pos.lat === 'number') {
        this.options.returnStepLat = pos.lat;
      }
      if (typeof pos.lon === 'number') {
        this.options.returnStepLon = pos.lon;
      }
      if (typeof pos.fov === 'number') {
        this.options.returnStepFov = pos.fov;
      }
    }
    return this;
  }

  autoBackToDefault(bool) {
    if (bool === undefined) {
      return this.options.autoBackToDefault;
    }
    this.options.autoBackToDefault = !!bool;
    this.returnButton.update();
    return this;
  }

  backToDefault() {
    this.returnButton.return = true;
    return this;
  }

  isDefaultPosition() {
    return this.panoCanvas.lat === this.panoCanvas.defaultLat
      && this.panoCanvas.lon === this.panoCanvas.defaultLon
      && this.panoCanvas.camera.fov === this.panoCanvas.defaultFov;
  }

  dispose() {
    // Remove class
    this.player.removeClass('vjs-pano-player');

    // Remove and dispose child components
    if (this.panoCanvas) {
      this.player.removeChild(this.panoCanvas);
      this.panoCanvas.dispose();
    }
    if (this.messageBox) {
      this.player.removeChild('MessageBox');
      this.messageBox.dispose();
    }
    if (this.returnButton) {
      this.player.getChild('ControlBar').removeChild(this.returnButton);
      this.returnButton.dispose();
    }

    // Reset player
    this.player.pause();
    this.player.currentTime(0);

    super.dispose();
  }

  ready(fn) {
    if (this.isReady) {
      fn();
    } else {
      this.on('ready', fn);
    }
    return this;
  }
}

// Register the plugin with videojs.
videojs.registerPlugin('panoPlayer', PanoPlayer);
