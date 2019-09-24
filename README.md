# Video.js PanoPlayer

A [video.js](http://videojs.com/) plugin for playing 360 panoramic video.

See a panoramic video demo and test the PanoPlayer plugin API [here]().

## Notes

Unknown compatibility. This plugin has only been tested on:

- Chrome 75 (Win)
- Firefox 68 (Win)
- Edge 44 (Win)
- Chrome Mobile (iOS 12, Android)
- Safari Mobile (iOS 12)
- Edge Mobile (Android)

## Inclusion

Include the PanoPlayer scripts **after** you include [video.js](https://videojs.com/) and [three.js](https://threejs.org), so that the `videojs` and `THREE` global are available in the plugin.

```html
<!-- Stylesheets -->
<link href="//path/to/video-js.css" rel="stylesheet">
<link href="//path/to/panoplayer.css" rel="stylesheet">

<!-- scripts -->
<script src="//path/to/video.min.js"></script>
<script src='//path/to/three.min.js'></script>
<script src="//path/to/panoplayer.min.js"></script>
```

## Usage

### Basic Usage

Call `panoPlayer()` on a video.js player instance to enable PanoPlayer plugin.

```javascript
// Set up video.js player by providing a <video> element's id
var player = videojs('my-video');

// Enable PanoPlayer plugin
var panoPlayer = player.panoPlayer();
```

Alternatively, you can pass an option object to the `panoPlayer()` method:

```javascript
var player = videojs('my-video');
var panoPlayer = player.panoPlayer({
  initLat: 180,
  initLon: 0,
});
```

`panoPlayer()` acts like a factory function and it is *replaced* for the current player by a new function which returns the plugin instance:

```javascript
var player = videojs('my-video');

// panoPlayer() has not been called, so it is a factory function
player.panoPlayer();

// panoPlayer() is now a function that returns the same instance of
// PanoPlayer that was generated by the previous call.
player.panoPlayer().getCurrentLat();
```

### Options

Options can be passed to the plugin in a plain object. Available options:

Option|Description|Type|Default
---|---|---|---
`initFov`|Initial value for camera's field of view.| Number|75
`maxFov`|Maximum value for camera's field of view.|Number| 100
`minFov`|Minimum value for camera's field of view.|Number| 50
`initLat`|Initial value for camera target's latitude.| Number|0
`maxLat`|Maximum value for camera target's latitude.| Number|85
`minLat`|Minimum value for camera target's latitude.| Number|-85
`initLon`|Initial value for camera target's longitude.| Number|0
`maxLon`|Maximum value for camera target's longitude.| Number|`Infinity`
`minLon`|Minimum value for camera target's longitude.| Number|`-Infinity`
`autoBackToDefault`|Automatically back to the default camera settings(field of view, latitude, longitude) when user is not interacting with the video|Boolean|`true` on desktop, `false` on mobile
`returnStepLat`|Camera moving speed when returning to the default latitude.|Number|1
`returnStepLon`|Camera moving speed when returning to the default longitude.|Number|1
`returnStepFov`|Camera moving speed when returning to the default field of view.|Number|1
`callback`|Callback function when PanoPlayer is ready.|Function|`null`

The value of `initFov`, `initLat`, `initLon` and `callback` cannot be changed once PanoPlayer instance is created.

### Methods

In additon to the video.js [plugin's methods](https://docs.videojs.com/plugin), PanoPlayer also adds the following methods:

Method|Description|Parameter|Return
---|---|---|---
`ready(callback)`|Bind a listener to the component's ready state. Different from event listeners in that if the ready event has already happened, it will trigger the function immediately.|Function|PanoPlayer instance
`init()`|Return the initial latitude, longitude and field-of-view|/|Object containing properties: `lat`, `lon` and `fov`
`init(optionobj)`|Set the initial latitude, longitude and field-of-view.|Object containing properties:<br>`lat`(opt): Number<br>`lon`(opt): Number<br>`fov`(opt): Number|PanoPlayer instance
`default()`|Return the default latitude, longitude and field-of-view|/|Object containing properties: `lat`, `lon` and `fov`
`default(optionobj)`|Set the default latitude, longitude and field-of-view.|Object containing properties:<br>`lat`(opt): Number<br>`lon`(opt): Number<br>`fov`(opt): Number|PanoPlayer instance
`current()`|Return the current latitude, longitude and field-of-view|/|Object containing properties: `lat`, `lon` and `fov`
`current(optionobj)`|Set the current latitude, longitude and field-of-view|Object containing properties:<br>`lat`(opt): Number<br>`lon`(opt): Number<br>`fov`(opt): Number|PanoPlayer instance
`max()`|Return the maximum latitude, longitude and field-of-view|/|Object containing properties: `lat`, `lon` and `fov`
`max(optionobj)`|Set the maximum latitude, longitude and field-of-view|Object containing properties:<br>`lat`(opt): Number<br>`lon`(opt): Number<br>`fov`(opt): Number|PanoPlayer instance
`min()`|Return the minimum latitude, longitude and field-of-view|/|Object containing properties: `lat`, `lon` and `fov`
`min(optionobj)`|Set the minimum latitude, longitude and field-of-view|Object containing properties:<br>`lat`(opt): Number<br>`lon`(opt): Number<br>`fov`(opt): Number|PanoPlayer instance
`returnStep()`|Return the returning step of latitude, longitude and field-of-view|/|Object containing properties: `lat`, `lon` and `fov`
`returnStep(optionobj)`|Set the retuning step of latitude, longitude and field-of-view|Object containing properties:<br>`lat`(opt): Number<br>`lon`(opt): Number<br>`fov`(opt): Number|PanoPlayer instance
`autoBackToDefault()`|Return whether the auto-back functionality is enabled|/|Boolean
`autoBackToDefault(bool)`|Enable or disable the auto-back functionality|Boolean|PanoPlayer instance
`isDefaultPosition()`|Return whether the camera is at the default position|/|Boolean
`dispose()`|Dispose the PanoPlayer plugin. Remove all customized components, event listeners and classes|/|/

### Events

The following events are trigged on the PanoPlayer instance:

Event|Description
---|---
`ready`|Trigged when PanoPlayer plugin is ready to use
`camerapositionchange`|Trigged when current latitude/longitude/field-of-view change
`returning`|Trigged when the camera is returning to the default position

### Examples

```javascript
var player = videojs('my-video');
var panoPlayer = player.panoPlayer();

// Log the data when camera position changes.
panoPlayer.on('camerapositionchange', function() {
  var current = panoPlayer.current();
  console.log('Latitude: ' + current.lat);
  console.log('Longitude: ' + current.lon);
  console.log('FoV: ' + current.fov);
});

// Set the default longitude to 180 and get back to the default position immediately.
panoPlayer.default({ lon: 180 });

// Disable auto-back functionality and set current camera position.
panoPlayer.autoBackToDefault(false).current({lat: 90, lon: 90, fov: 100})

// Dispose the PanoPlayer plugin and use the default video.js player.
panoPlayer.dispose();
```
