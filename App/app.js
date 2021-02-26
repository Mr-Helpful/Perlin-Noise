// generates a circular kernel with the given radius and fade function
function circleKernel(r, fade = t=>1){
  r--
  let l = 2*r + 1
  return [...Array(l).keys()].map(y => {
    return [...Array(l).keys()].map(x => {
      let t = 1 - Math.sqrt((x-r)*(x-r) + (y-r)*(y-r))/r
      return t < 0? 0: fade(t)
    })
  })
}

let pMap
function init(){
  let earthFade = fades.hexFade(defaults.heatmap.colourScales.earth)
  let canvas = document.getElementById("heatmap")

  pMap = new Perlin(2, earthFade, canvas)
  let kernel = circleKernel(20, defaults.heatmap.kernelFuncs.smooth)
  pMap.enableDrawing(kernel, 0.05, 50)

  initLevels(pMap, defaults.levels, 4)
}

function testDrawSpeed(){
  console.log("starting test...")
  let t = performance.now()
  for(let x = 0; x < 100; x++){
    pMap.redrawMap()
  }
  t = Math.floor((performance.now()-t)/100)
  console.log("drawing the heatmap took: %c" + t + "ms%c on average", "color: green", "")
}
