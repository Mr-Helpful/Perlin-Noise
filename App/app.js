let pMap

function init() {
  let earthFade = fades.hexFade(data.heatmap.colourScales.viridis)
  let canvas = document.getElementById("heatmap")
  let controls = d3.select("#levels")

  pMap = new Perlin(2, earthFade, canvas)
  let kernel = circleKernel(20, data.heatmap.kernelFuncs.smooth)
  pMap.enableDrawing(data.heatmap.brush.medium, 0.04, 50)

  // initLevels(pMap, defaults.levels, 4)
  Levels(pMap, controls, data.levels, 4)
}

function testDrawSpeed(N = 100) {
  console.log("starting test...")
  let t = performance.now()
  for (let x = 0; x < N; x++) {
    pMap.redrawMap()
  }
  t = Math.floor((performance.now() - t) / 100)
  console.log("drawing the heatmap took: %c" + t + "ms%c on average (tested " + N + " times)", "color: green", "")
}