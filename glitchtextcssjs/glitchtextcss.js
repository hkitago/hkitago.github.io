(()=>{
  'use strict';
  const app = {}, settings = {}
  app.d = document
  app.glitches = app.d.getElementsByClassName('glitch')
  settings.fps = 21
  settings.minRect = 0
  
  for(let i = 0, max = app.glitches.length; i < max; i++){
    const rect = app.glitches[i].getBoundingClientRect()
    let cssText = '@keyframes glitch {' + "\n"
    for(let j = 0, max = settings.fps; j < max; j++){
      const rectTop = Math.floor(Math.random() * (rect.height - settings.minRect)) + settings.minRect
      const rectBottom = Math.floor(Math.random() * (rect.height - rectTop)) + rectTop
      cssText += (j / settings.fps) * 100 + '% {clip: rect(' + rectTop + 'px, auto, '+rectBottom+'px, 0);}' + "\n"
    }
    cssText += '}'
    const sE = app.d.createElement('style')
    ,     tE = app.d.createTextNode(cssText);
    sE.appendChild(tE);
    app.d.head.appendChild(sE);
  }
})()