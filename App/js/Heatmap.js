class Perlin{
  constructor(gridWidth, colourMap, canvas){
    this.cnv = canvas
    this.ctx = this.cnv.getContext("2d")
    this.ctx.scale(gridWidth, gridWidth)
    this.iDims = [Math.ceil(this.cnv.width/gridWidth),
                  Math.ceil(this.cnv.height/gridWidth)]

    this.cnvInt = new OffscreenCanvas(this.iDims[0], this.iDims[1])
    this.ctxInt = this.cnvInt.getContext("2d")

    this.gridW = gridWidth
    this.cMap = colourMap
    this.perlinLevels = []
    this.pFlag = false

    // an empty list, to be filled with Amplitudes
    // these represent the z position on the heatmap
    this.resetMaps()
  }

  /* a generic method used to fully reset the perlin heatmap */
  // the time complexity is O(n) (dependant on the number of levels)
  resetMaps(){
    let [w, h] = this.iDims
    this.perlinMap = new Array(w*h).fill(0)
    this.maxLength = w*h-1

    for(let level of this.perlinLevels){
      this.addToData(level)
    }
  }

  // enables drawing on the canvas using the specified kernel as a brush
  enableDrawing(kernel, A, T){
    this.mx = this.my = 0

    // we actually need to define these functions before using them
    // as we need to have Exactly the same function to remove the event listener
    this.downEvent = this.startDrawing.bind(this, kernel, A, T)
    this.moveEvent = this.moveBrush.bind(this)
    this.upEvent = this.endDrawing.bind(this)
    this.cnv.addEventListener("pointerdown", this.downEvent)
    this.cnv.addEventListener("pointermove", this.moveEvent)
    this.cnv.addEventListener("mouseout", this.upEvent)
    this.cnv.addEventListener("pointerup", this.upEvent)
  }

  disableDrawing(){
    this.cnv.removeEventListener("pointerdown", this.downEvent)
    this.cnv.removeEventListener("pointermove", this.moveEvent)
    this.cnv.removeEventListener("pointerup", this.upEvent)
  }

  startDrawing(kernel, A, T, e){
    let addFunc = this.kernelAdd.bind(this, kernel, A)
    this.drawInterval = setInterval(addFunc, T)
  }

  moveBrush(e){
    let rect = e.target.getBoundingClientRect()
    this.mx = e.clientX - rect.left //x position within the element.
    this.my = e.clientY - rect.top  //y position within the element.
    this.mp = e.pressure || this.mp
  }

  endDrawing(e){
    clearInterval(this.drawInterval)
  }

  kernelShrink(kernel){
    let [m, n] = [kernel[0].length, kernel.length].map(d => Math.floor(d*this.mp))
    let blank = Array(n).fill(Array(m).fill(0))

    return blank.map((row, j) => {
      return row.map((_, i) => {
        let x = Math.ceil(i/this.mp)
        let y = Math.ceil(j/this.mp)
        return kernel[y][x]
      })
    })
  }

  // adds a specified kernel at a specified (x, y) coordinate on the board
  kernelAdd(kernel, A){
    let x = Math.floor(this.mx/this.gridW)
    let y = Math.floor(this.my/this.gridW)

    let nKernel = this.kernelShrink(kernel)
    console.log(nKernel)
    // this is the wrong way around for an m*n matrix but it fits the w, h convention
    let [m, n] = [nKernel[0].length, nKernel.length].map(d => Math.floor(d/2))
    let [w, h] = this.iDims

    // clamps the center offsets for the kernel
    // to ensure the kernel isn't applied to points outside the image
    let i = [Math.min(m, x), Math.min(m, w-x)]
    let j = [Math.min(n, y), Math.min(n, h-y)]

    // determines the offset to the top left corner of the kernel
    let kx = x-m
    let ky = y-n

    // determines the range to take from the kernel
    let kxr = [m-i[0], m+i[1]+1]
    let kyr = [n-j[0], n+j[1]+1]

    for(x=kxr[0]; x<kxr[1]; x++){
      for(y=kyr[0]; y<kyr[1]; y++){
        i = x+kx
        j = y+ky
        let t = j*this.iDims[0]+i,
            s = nKernel[y][x]*A
        this.perlinMap[t] += s
      }
    }
    this.redrawMap()
  }

  addToData(level){
    // unpack level and bring into cache
    let [f, A, s] = level
    let [w, h] = this.iDims
    noise.seed(s)

    // we find use the longer side to ensure that only one repetition is shown on canvas
    // this should be regardless of the aspect ratio of the canvas used
    let m = Math.max(w, h)

    // loop over all the positions in the perlin grid
    for(let y = 0; y < h; y++){
      for(let x = 0; x < w; x++){
        // generate the noise with a range of 0 -> 1
        s = noise.perlin2(x*f/m, y*f/m)

        // the noise val to perlin.perlinData
        let t = y*w + x
        this.perlinMap[t] += s * A
      }
    }
  }

  // adds a new level to the pre-existing data
  addLevel(point){
    let nLevel = this.getLevel(point)
    this.perlinLevels.push(nLevel)
    this.addToData(nLevel)
  }

  // edits a given level
  editLevel(point){
    let [f, A, _] = this.getLevel(point)
    let [l, i] = this.fetchLevel(f)

    // if we can't find the level among the existing ones
    // this shouldn't happen
    if(i == -1){
      console.warn("This level does not exist, creating a new one instead")
      this.addLevel([f, A])
    }

    // if the Amplitude has been changed
    else if(A != l[1]){
      this.addToData([l[0], A-l[1], l[2]])
      this.perlinLevels[i][1] = A
    }
  }

  // resets a given level, by generating it over
  resetLevel(point){
    let [f, A, s] = this.getLevel(point)
    let [l, i] = this.fetchLevel(f)

    // removes the effect the previous level
    this.addToData([l[0], -l[1], l[2]])

    // adds the effect of the new level
    this.addToData([f, A, s])

    this.perlinLevels[i] = [f, A, s]
    this.redrawMap()
  }

  // deletes a level from the data and redraws the map
  // this is done in order O(1) time (dependant on the number of levels)
  delLevel(point){
    let [f, A, _] = this.getLevel(point)
    let [l, i] = this.fetchLevel(f)
    this.addToData([l[0], -l[1], l[2]])
    this.perlinLevels.splice(i, 1)
  }

  // translates the data from a point to a level
  getLevel(point){
    // a new level also includes a random seed
    return [2**point[0], 2**point[1], Math.random()]
  }

  // fetches a level with a matching frequency
  // we don't use a dictionary as:
  // 1) it is extremely unlikely that we will ever have more than 10 levels
  //    hence O(n) is an acceptable time complexity
  // 2) using an array makes it much more simple to iterate over the levels
  //    iterating over the levels is used to set a default
  fetchLevel(f){
    // this:
    // l[0]==f?[[...l], i]:acc
    // returns a copy of the level if the frequencies match
    // otherwise, it ignores it
    return this.perlinLevels.reduce((acc, l, i) => l[0]==f?[[...l], i]:acc, [-1, -1])
  }

  // colourScale:
  // function used to draw the terrain map
  // should take a value from 0 -> 1
  // and return a list of 4 values from 0 -> 255, representing RGBA values
  redrawMap(){
    if(this.perlinLevels.length == 0) return 0
    let max = this.perlinLevels.reduce((acc, v) => v[1]+acc, 0) * (2**0.5)
    let img = this.ctxInt.createImageData(...this.iDims)
    let rgba

    for(let i in this.perlinMap){
      rgba = this.cMap(this.perlinMap[i]/max + 0.5)
      img.data[4*i + 0] = rgba[0]
      img.data[4*i + 1] = rgba[1]
      img.data[4*i + 2] = rgba[2]
      img.data[4*i + 3] = rgba[3]
    }

    // as this.cnvInt represents an OffscreenCanvas, we can treat it as an
    // image.
    // We need to do this step as putImageData disregards transforms on
    // the canvas, whereas drawImage doesn't.
    this.ctxInt.putImageData(img, 0, 0)
    this.ctx.drawImage(this.cnvInt, 0, 0)
  }
}
