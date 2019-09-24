import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  SphereBufferGeometry,
  MeshBasicMaterial,
  VideoTexture,
  Mesh,
} from 'three';
import * as Util from './Util';

function PanoCanvas(SuperClass, plugin) {
  const CAMERA_NEAR = 1;
  const CAMERA_FAR = 1000;

  const SPHERE_RADIUS = 500;
  const SPHERE_WIDTH_SEGMENTS = 60;
  const SPHERE_HEIGHT_SEGMENTS = 40;

  const DRAG_SPEED = 0.15;

  return {
    constructor(player, options = {}) {
      this.plugin = plugin;

      this.width = player.currentWidth();
      this.height = player.currentHeight();

      this.defaultFov = this.plugin.options.initFov;
      this.defaultLon = this.plugin.options.initLon;
      this.defaultLat = this.plugin.options.initLat;
      this.lon = this.defaultLon;
      this.lat = this.defaultLat;

      this.mouseDown = false;
      this.isUserInteracting = false;
      this.returning = false;

      // Event handler binding
      this.onMouseEnter = this.onMouseEnter.bind(this);
      this.onMouseLeave = this.onMouseLeave.bind(this);
      this.onResize = this.onResize.bind(this);
      this.onPlay = this.onPlay.bind(this);
      this.onFullscreen = this.onFullscreen.bind(this);
      this.onEnded = this.onEnded.bind(this);

      // Set up a threejs scene
      this.scene = new Scene();
      this.camera = new PerspectiveCamera(
        this.defaultFov,
        this.width / this.height,
        CAMERA_NEAR,
        CAMERA_FAR,
      );

      this.camera.lookAt(...Util.getCameraTargetPos(this.lat, this.lon, SPHERE_RADIUS));

      this.renderer = new WebGLRenderer();
      this.renderer.setSize(this.width, this.height);
      this.renderer.setPixelRatio(window.devicePixelRatio);
      this.renderer.autoClear = false;

      this.geometry = new SphereBufferGeometry(
        SPHERE_RADIUS,
        SPHERE_WIDTH_SEGMENTS,
        SPHERE_HEIGHT_SEGMENTS,
      );
      // Invert the geometry on the x-axis so that all of the faces point inward
      this.geometry.scale(-1, 1, 1);

      // Get the html5 video element and use it as threejs video texture
      const video = player.tech('').el();
      this.material = new MeshBasicMaterial({ map: new VideoTexture(video) });

      this.scene.add(new Mesh(this.geometry, this.material));

      // Update the component's DOM element
      const optionsCopy = Util.deepCopy(options);
      optionsCopy.el = this.renderer.domElement;
      optionsCopy.el.classList.add('vjs-panoplayer-canvas');
      SuperClass.call(this, player, optionsCopy);

      // Hide default video player
      video.style.visibility = 'hidden';
      this.el().style.display = 'block';

      this.attachEventListeners();
      this.hide();
    },

    attachEventListeners() {
      const player = this.player();

      this.on('mousedown', event => this.onMouseDown(event));
      this.on('mousemove', event => this.onMouseMove(event));
      this.on('mouseup', event => this.onMouseUp(event));
      this.on('mousewheel', event => this.onMouseWheel(event));
      this.on('DOMMouseScroll', event => this.onMouseWheel(event));
      this.on('dispose', () => this.onDispose());

      this.el().addEventListener('touchstart', event => this.onTouchStart(event), { passive: false });
      this.el().addEventListener('touchmove', event => this.onTouchMove(event), { passive: false });
      this.el().addEventListener('touchend', event => this.onTouchEnd(event), { passive: false });

      player.on('mouseenter', this.onMouseEnter);
      player.on('mouseleave', this.onMouseLeave);
      player.on('fullscreenchange', this.onResize);
      player.on('playerresize', this.onResize);
      player.on('ended', this.onEnded);
      player.on('firstplay', this.onPlay);

      // Disable fullscreen mode and enable fullwindow mode in iOS
      if (this.plugin.options.isIOS) {
        const { fullscreenToggle } = player.controlBar;
        fullscreenToggle.off('tap', fullscreenToggle.handleClick);
        fullscreenToggle.on('tap', this.onFullscreen);
      }
    },

    animate() {
      this.animationId = this.requestAnimationFrame(this.animate.bind(this));
      this.render();
    },

    render() {
      let cameraNeedUpdate = false;
      const { options } = this.plugin;
      this.returning = options.autoBackToDefault && !this.isUserInteracting;

      // Compute current latitude, longtitude and fov if user is not interacting with the video
      // Slowly return to the default settings
      if (this.returning) {
        if (this.lat !== this.defaultLat && options.returnStepLat !== 0) {
          cameraNeedUpdate = true;
          this.lat = Util.getNextNum(this.lat, this.defaultLat, options.returnStepLat);
        }
        if (this.lon !== this.defaultLon && options.returnStepLon !== 0) {
          cameraNeedUpdate = true;
          this.lon = Util.getNextNum(this.lon, this.defaultLon, options.returnStepLon);
        }
        if (this.camera.fov !== this.defaultFov && options.returnStepFov !== 0) {
          cameraNeedUpdate = true;
          this.camera.fov = Util.getNextNum(this.camera.fov, this.defaultFov, options.returnStepFov);
        }
      }

      // Update camera target position if needed
      if (cameraNeedUpdate) {
        this.update();
        this.plugin.trigger('returning');
      }

      // Render the scene
      this.renderer.render(this.scene, this.camera);
    },

    update() {
      this.camera.lookAt(...Util.getCameraTargetPos(this.lat, this.lon, SPHERE_RADIUS));
      this.camera.updateProjectionMatrix();
      this.plugin.trigger('camerapositionchange');
    },

    onMouseDown(event) {
      event.preventDefault();
      if (!this.player().ended()) {
        const [clientX, clientY] = Util.getMousePos(event);
        if (clientX === 'undefined' || clientY === 'undefined') {
          return;
        }

        this.mouseDown = true;
        this.isUserInteracting = true;
        this.onPointerDownPointerX = clientX;
        this.onPointerDownPointerY = clientY;
        this.onPointerDownLon = this.lon;
        this.onPointerDownLat = this.lat;
      }
    },

    onMouseMove(event) {
      event.preventDefault();
      if (this.mouseDown) {
        const [clientX, clientY] = Util.getMousePos(event);
        if (clientX === 'undefined' || clientY === 'undefined') {
          return;
        }

        // Compute current latitude and longtitude
        const { options } = this.plugin;
        this.lat = (clientY - this.onPointerDownPointerY) * DRAG_SPEED + this.onPointerDownLat;
        this.lon = (this.onPointerDownPointerX - clientX) * DRAG_SPEED + this.onPointerDownLon;
        this.lat = Util.clamp(this.lat, options.minLat, options.maxLat);
        this.lon = Util.clamp(this.lon, options.minLon, options.maxLon);

        // Update camera target's position
        this.camera.lookAt(...Util.getCameraTargetPos(this.lat, this.lon, SPHERE_RADIUS));
        this.plugin.trigger('camerapositionchange');
      }
    },

    onMouseUp(event) {
      event.preventDefault();
      this.mouseDown = false;
    },

    onMouseEnter() {
      this.isUserInteracting = true;
    },

    onMouseLeave() {
      this.isUserInteracting = false;
      this.mouseDown = false;
    },

    onMouseWheel(event) {
      event.preventDefault();
      this.camera.fov += Util.normalizeWheel(event);
      this.camera.fov = Util.clamp(this.camera.fov, this.plugin.options.minFov, this.plugin.options.maxFov);
      this.camera.updateProjectionMatrix();
      this.plugin.trigger('camerapositionchange');
    },

    onTouchStart(event) {
      this.isUserInteracting = true;
      if (event.touches.length > 1) {
        this.isUserPinch = true;
        this.multiTouchDistance = Util.getTouchesDistance(event.touches);
      }
      this.onMouseDown(event);
    },

    onTouchEnd(event) {
      this.isUserInteracting = false;
      this.isUserPinch = false;
      this.onMouseUp(event);
    },

    onTouchMove(event) {
      // handle single touch event
      if (!this.isUserPinch || event.touches.length <= 1) {
        this.onMouseMove(event);
      } else {
        // handle pinch event
        const currentDistance = Util.getTouchesDistance(event.touches);
        event.wheelDeltaY = (currentDistance - this.multiTouchDistance) * 10;
        this.onMouseWheel(event);
        this.multiTouchDistance = currentDistance;
      }
    },

    onResize() {
      this.width = this.player().currentWidth();
      this.height = this.player().currentHeight();

      this.renderer.setSize(this.width, this.height);

      this.camera.aspect = this.width / this.height;
      this.camera.updateProjectionMatrix();
      this.plugin.trigger('camerapositionchange');
    },

    onPlay() {
      this.defaultFov = this.plugin.options.initFov;
      this.defaultLon = this.plugin.options.initLon;
      this.defaultLat = this.plugin.options.initLat;

      this.lat = this.defaultLat;
      this.lon = this.defaultLon;
      this.camera.fov = this.defaultFov;
      this.update();

      this.animate();
      this.show();
    },

    onFullscreen() {
      const player = this.player();
      if (!player.isFullscreen()) {
        player.isFullscreen(true);
        player.enterFullWindow();
        this.onResize();
      } else {
        player.isFullscreen(false);
        player.exitFullWindow();
        this.onResize();
      }
    },

    onEnded() {
      if (this.animationId) {
        this.cancelAnimationFrame(this.animationId);
      }
      this.player().hasStarted(false);
    },

    onDispose() {
      // Cancel Animation
      if (this.animationId) {
        this.cancelAnimationFrame(this.animationId);
      }

      // Remove event handlers on player
      const player = this.player();
      player.off('mouseenter', this.onMouseEnter);
      player.off('mouseleave', this.onMouseLeave);
      player.off('fullscreenchange', this.onResize);
      player.off('playerresize', this.onResize);
      player.off('firstplay', this.onPlay);

      // Reset event handler on FullscreenToggle
      const { fullscreenToggle } = player.controlBar;
      fullscreenToggle.off('tap', this.onFullscreen);
      fullscreenToggle.on('tap', fullscreenToggle.handleClick);

      // Show default video player
      player.tech('').el().style.visibility = 'visible';
    },
  };
}

export default PanoCanvas;
