import { CanvasPen } from './CanvasPen.js'

export class Perlin {
  constructor(gridWidth, colourFunc, canvas) {
    this.ctx = canvas.getContext('2d', { alpha: false })
    this.ctx.scale(gridWidth, gridWidth)
    this.iW = Math.ceil(canvas.width / gridWidth)
    this.iH = Math.ceil(canvas.height / gridWidth)

    const internal = document.createElement('canvas')
    internal.width = this.iW
    internal.height = this.iH
    this.ctxInt = internal.getContext('2d', { alpha: false })

    this.gridW = gridWidth
    this.cFunc = colourFunc
    this.perlinLevels = []

    // an empty list, to be filled with Amplitudes
    // these represent the z position on the heatmap
    this.resetMaps()
  }

  /** A generic method used to fully reset both heatmaps */
  resetMaps() {
    let [w, h] = [this.iW, this.iH]
    this.perlinMap = new Array(w * h).fill(0)
    this.penMap = new Array(w * h).fill(0)

    for (const level of this.perlinLevels) {
      this.addToData(level)
    }
    this.redrawMap()
  }

  /** Enables drawing on the canvas using the specified kernel as a brush
   * @param {Array[Array[Float]]} kernel - the kernel to draw with
   * @param {Int} A - a scaling factor to adjust the the strength of the pen
   * @param {Float} T - the time period with which to draw and refresh
   */
  enableDrawing(kernel, A, T) {
    this.pen = new CanvasPen(this.ctx.canvas, T)
    this.setBrush(kernel, A)
  }

  /** Sets the current brush used on the canvas.
   * Separated from the enableDrawing method to allow brushes to be changed.
   * @param {Array[Array[Float]]} kernel - the kernel to be used on the canvas
   * @param {Float} A - a scalar factor for the scalar of the brush
   */
  setBrush(kernel, A) {
    let drawFunc = this.kernelAdd.bind(this, kernel, A)
    this.pen.setDrawFunc(drawFunc)
  }

  /** Fully disables drawing on the canvas, removing relevant event listeners */
  disableDrawing() {
    this.pen.release()
    this.pen = null
  }

  /** Shrinks a kernel by a given scale factor
   * @param {Array[Array[Float]]} kernel - the kernel to shrink
   * @param {Float} p - a scale factor (0..1) to shrink by
   */
  kernelShrink(kernel, p) {
    let [m, n] = [kernel[0].length, kernel.length].map(d => Math.floor(d * p))
    let blank = Array(n).fill(Array(m).fill(0))

    return blank.map((row, j) => {
      return row.map((_, i) => {
        let x = Math.ceil(i / p)
        let y = Math.ceil(j / p)
        return kernel[y][x]
      })
    })
  }

  /** Adds a kernel to a specified x, y point on the pen heatmap
   * @param {Array[Array[Float]]} kernel - the kernel to draw with
   * @param {Int} A - the amplitude to scale the kernel with
   * @param {Int} x - the x coordinate to draw at
   * @param {Int} y - the y coordinate to draw at
   * @param {Float} p - the mouse pressure to draw with
   */
  kernelAdd(kernel, A, x, y, p) {
    x = Math.floor(x / this.gridW)
    y = Math.floor(y / this.gridW)

    let nKernel = this.kernelShrink(kernel, p)
    // this is the wrong way around for an m*n matrix but it fits the w, h convention
    let m = Math.floor(nKernel[0].length / 2),
      n = Math.floor(nKernel.length / 2)
    let w = this.iW,
      h = this.iH

    // clamps the center offsets for the kernel
    // to ensure the kernel isn't applied to points outside the image
    let i = [Math.min(m, x), Math.min(m, w - x)]
    let j = [Math.min(n, y), Math.min(n, h - y)]

    // determines the offset to the top left corner of the kernel
    let kx = x - m
    let ky = y - n

    // determines the range to take from the kernel
    let kxr = [m - i[0], m + i[1] + 1]
    let kyr = [n - j[0], n + j[1] + 1]

    for (x = kxr[0]; x < kxr[1]; x++) {
      for (y = kyr[0]; y < kyr[1]; y++) {
        i = x + kx
        j = y + ky
        let t = j * w + i,
          s = nKernel[y][x] * A
        this.penMap[t] += s
      }
    }
    this.redrawMap()
  }

  /** Adds a level to the perlin noise heatmap
   * @param {Array[Float]} level - an array specifying the level to be added
   */
  addToData(level) {
    // unpack level and bring into cache
    let [f, A, s] = level
    let w = this.iW,
      h = this.iH
    noise.seed(s)

    // we find use the longer side to ensure that only one repetition is shown on canvas
    // this should be regardless of the aspect ratio of the canvas used
    let m = Math.max(w, h)

    // loop over all the positions in the perlin grid
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        // generate the noise with a range of 0 -> 1
        s = noise.perlin2((x * f) / m, (y * f) / m)

        // the noise val to perlin.perlinData
        let t = y * w + x
        this.perlinMap[t] += s * A
      }
    }
  }

  /** Adds a single level to the internal heatmap
   * @param {Array[Float]} point - a coordinate specifying (log2 f, log2 A)
   */
  addLevel(point) {
    let nLevel = this.getLevel(point)
    this.perlinLevels.push(nLevel)
    this.addToData(nLevel)
  }

  // edits a given level
  /** Edits the amplitude of a single level on the internal heatmap
   * @param {Array[Int]} point - the point specifying the level to edit and its new amplitude
   */
  editLevel(point) {
    let [f, A, _] = this.getLevel(point)
    let [l, i] = this.fetchLevel(f)

    // if we can't find the level among the existing ones (which shouldn't happen)
    if (i == -1) {
      // we create a new level
      console.warn('This level does not exist, creating a new one instead')
      this.addLevel([f, A])
    }

    // if the Amplitude has been changed
    else if (A != l[1]) {
      this.addToData([l[0], A - l[1], l[2]])
      this.perlinLevels[i][1] = A
    }
  }

  /** Resets a single level in the internal heatmap and redraws the canvas
   * @param {Array[Int]} point - the point to reset a level for
   */
  resetLevel(point) {
    let [f, A, s] = this.getLevel(point)
    let [l, i] = this.fetchLevel(f)

    // removes the effect the previous level
    this.addToData([l[0], -l[1], l[2]])

    // adds the effect of the new level
    this.addToData([f, A, s])

    this.perlinLevels[i] = [f, A, s]
    this.redrawMap()
  }

  /** Deletes a single level from the internal heatmap
   * @param {Array[Int]} point - the point specifying which level to delete
   */
  delLevel(point) {
    let [f, A, _] = this.getLevel(point)
    let [l, i] = this.fetchLevel(f)
    this.addToData([l[0], -l[1], l[2]])
    this.perlinLevels.splice(i, 1)
  }

  // translates the data from a point to a level
  /** Gets new level data based on the point given
   * @param {Array[Int]} point - the point specifying the level to create
   * @return {Array[Float]} - the new level generated, with a random seed
   */
  getLevel(point) {
    // a new level also includes a random seed
    return [2 ** point[0], 2 ** point[1], Math.random()]
  }

  /** Fetches a level with a matching frequency. A dictionary is not used to
   * implement perlinLevels as:
   * 1 - O(n) is acceptable for n < 20 (n is the number of levels)
   * 2 - an Array is somewhat easier to iterate over, which is used in this.setDefault
   * @param {Int} f - the frequency to search for
   * @return {Array[Any]} - an array representing [<perlin level>, <index of level>]
   */
  fetchLevel(f) {
    // this:
    // l[0]==f?[[...l], i]:acc
    // returns a copy of the level if the frequencies match
    // otherwise, it ignores it
    return this.perlinLevels.reduce(
      (acc, l, i) => (l[0] == f ? [[...l], i] : acc),
      [[-1, -1, -1], -1]
    )
  }

  /** Updates the heatmap displayed by the canvas */
  redrawMap() {
    if (this.perlinLevels.length == 0) return 0
    let max = this.perlinLevels.reduce((acc, v) => v[1] + acc, 0) * 2 ** 0.5
    let img = this.ctxInt.createImageData(this.iW, this.iH)
    let rgba, v, i

    for (i in this.perlinMap) {
      // get the effect of both the perlin and pen map
      v = this.perlinMap[i] + this.penMap[i]
      // normalise this value and get the corresponding rgba data
      rgba = this.cFunc(v / max + 0.5)
      // write the rgba values to the pixel in img.data
      img.data[4 * i + 0] = rgba[0]
      img.data[4 * i + 1] = rgba[1]
      img.data[4 * i + 2] = rgba[2]
      img.data[4 * i + 3] = rgba[3]
    }

    // as this.cnvInt represents an OffscreenCanvas, we can treat it similarly
    // to an image.
    // We need to do this step as putImageData disregards transforms on
    // the canvas, whereas drawImage doesn't.
    this.ctxInt.putImageData(img, 0, 0)
    this.ctx.drawImage(this.ctxInt.canvas, 0, 0)
  }
}
