function ReturnButton(SuperClass, plugin) {
  return {
    constructor(player, options) {
      SuperClass.call(this, player, options);
      this.plugin = plugin;

      this.update();
      this.on(['click', 'tap'], () => {
        this.plugin.options.autoBackToDefault = !this.plugin.options.autoBackToDefault;
        this.update();
      });
    },

    update() {
      if (this.plugin.options.autoBackToDefault) {
        this.el().title = 'Auto-Return Off';
        this.removeClass('vjs-return-button-on');
        this.addClass('vjs-return-button-off');
      } else {
        this.el().title = 'Auto-Return On';
        this.removeClass('vjs-return-button-off');
        this.addClass('vjs-return-button-on');
      }
    },
  };
}

export default ReturnButton;
