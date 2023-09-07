(()=>{
	let app = {}
	const canvas = document.createElement('canvas')
	document.body.appendChild(canvas)
	const ctx = canvas.getContext('2d')
	ctx.willReadFrequently = true
	canvas.id = 'canvas'
  document.getElementById('canvas').classList.toggle('fuzzOn') 

  const resize = () => {
    canvas.width = window.innerWidth * window.devicePixelRatio
    canvas.height = window.innerHeight * window.devicePixelRatio
    canvas.style.width = window.innerWidth + 'px'
    canvas.style.height = window.innerHeight + 'px'
    canvas.classList.add('swipe')
    app.canvasWidth = canvas.width
    app.canvasHeight = canvas.height
  	app.mosaicSize = (app.canvasWidth > app.canvasHeight ? app.canvasWidth : app.canvasHeight) / 100
  	app.mosaicSizeRate = app.mosaicSizeRate ? app.mosaicSizeRate : 10
  }
  screen.orientation.onchange = resize
  window.onresize = resize
  window.addEventListener('load', resize)
  
  window.addEventListener('wheel', (e) => {
    e.preventDefault()
  	app.mosaicSizeRate = app.mosaicSizeRate + event.deltaY * -1 * 0.01
  	app.mosaicSizeRate = Math.min(Math.max(5, app.mosaicSizeRate), 50)
  })
  
	const render = () => {
		ctx.clearRect(0, 0, app.canvasWidth, app.canvasHeight)
		const rand = Math.round(Math.random() * app.mosaicSize * app.mosaicSizeRate) + app.mosaicSize
		CreateMosaic(ctx, app.canvasWidth, app.canvasHeight, rand)
		window.requestAnimationFrame(render)
	}
	window.requestAnimationFrame(render)
	
	const CreateMosaic = (context, width, height, mosaicSize) => {
		for (let y = 0; y < height; y = y + mosaicSize) {
			for (let x = 0; x < width; x = x + mosaicSize) {
				context.fillStyle = 'hsl(' + 360 * Math.random() + ', 100%, 50%)';
				context.fillRect(x, y, x + mosaicSize, y + mosaicSize)
			}
		}
	}

/*****************************************************************************
 * Swipe for app.mosaicSizeRate
 ****************************************************************************/
  const swipeNodes = document.querySelectorAll('.swipe')
  let isTouched = false
  const basePoint = {'x': 0, 'y': 0, 'mosaicSizeRate': Number(app.mosaicSizeRate), }
  Array.from(swipeNodes).map((x) => {
    x.addEventListener('touchstart', (e) => {
      e.preventDefault()
      isTouched = true
      basePoint['x'] = e.touches[0].clientX
      basePoint['y'] = e.touches[0].clientY
      basePoint['mosaicSizeRate'] = app.mosaicSizeRate
    })
    x.addEventListener('touchmove', (e) => {
      if(!isTouched) {return false}
      e.preventDefault()
      const distPoint = {'x': e.touches[0].clientX - basePoint['x'],'y': e.touches[0].clientY - basePoint['y'],}
  		app.mosaicSizeRate = basePoint['mosaicSizeRate'] + distPoint['y'] * 0.01
  		app.mosaicSizeRate = Math.min(Math.max(5, app.mosaicSizeRate), 50)
    })
    x.addEventListener('touchend', (e) => {
      if(!isTouched) {return false}
      e.preventDefault()
      isTouched = false
      basePoint['mosaicSizeRate'] = app.mosaicSizeRate
    })
  })
})()