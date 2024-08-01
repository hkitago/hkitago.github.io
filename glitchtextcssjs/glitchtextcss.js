(() => {
  'use strict';

  const myApp = {
    app: {},
    settings: {}
  };

  myApp.app.d = document;
  myApp.app.glitches = Array.from(myApp.app.d.getElementsByClassName('glitch'));
  myApp.settings.fps = 21;
  myApp.settings.minRect = 0;

  myApp.app.glitches.forEach((glitch) => {
    const rect = glitch.getBoundingClientRect();
    let cssText = '@keyframes glitch {\n';

    Array.from({ length: myApp.settings.fps }).forEach((_, j) => {
      const rectTop = Math.floor(Math.random() * (rect.height - myApp.settings.minRect)) + myApp.settings.minRect;
      const rectBottom = Math.floor(Math.random() * (rect.height - rectTop)) + rectTop;
      cssText += (j / myApp.settings.fps) * 100 + '% {clip: rect(' + rectTop + 'px, auto, ' + rectBottom + 'px, 0);}\n';
    });

    cssText += '}';
    const sE = myApp.app.d.createElement('style');
    const tE = myApp.app.d.createTextNode(cssText);
    sE.appendChild(tE);
    myApp.app.d.head.appendChild(sE);
    glitch.classList.add('on');
  });
})();
