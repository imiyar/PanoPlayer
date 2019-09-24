function MessageBox(SuperClass, plugin) {
  const HIDDEN_DELAY_TIME = 3000;
  const TRANSITION_DELAY_TIME = 1000;

  return {
    constructor(player, options) {
      SuperClass.call(this, player, options);
      this.plugin = plugin;

      this.addClass('vjs-message-box');
      this.el().innerHTML = options.message;

      this.autoFadeOut = this.autoFadeOut.bind(this);
      this.hideOnPlay = this.hideOnPlay.bind(this);

      if (options.autoFadeOut) {
        this.hide();
        player.one('play', this.autoFadeOut);
      }

      if (options.hideOnPlay) {
        player.one('play', this.hideOnPlay);
      }

      this.on('dispose', () => this.onDispose());
    },

    autoFadeOut() {
      this.show();
      this.setTimeout(() => {
        this.addClass('vjs-message-box-hidden');
      }, TRANSITION_DELAY_TIME);
      this.setTimeout(() => this.hide(), HIDDEN_DELAY_TIME);
    },

    hideOnPlay() {
      this.hide();
    },

    onDispose() {
      const player = this.player();
      player.off('play', this.autoFadeOut);
      player.off('play', this.hideOnPlay);
    },
  };
}

export default MessageBox;
