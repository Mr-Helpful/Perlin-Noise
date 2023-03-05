/** @typedef {Function} DrawFunc
 * @arg {Int} x - the x coordinate to draw at
 * @arg {Int} y - the y coordinate to draw at
 * @arg {Float} p - the pointer pressure to draw with
 */
export class CanvasPen {
  /** Constructs a new pen, and attaches the relevant event listeners
   * @param {HTML object} canvas - the canvas to draw on
   * @param {Int} T - the refresh rate for the pen
   */
  constructor(canvas, T) {
    this.cnv = canvas
    this.mx = this.my = this.mp = 0
    this.drawFunc = () => {}
    this.T = T

    // we actually need to define these functions before using them
    // as we need to have Exactly the same function to remove the event listener
    this.downEvent = this.startDrawing.bind(this)
    this.moveEvent = this.moveBrush.bind(this)
    this.upEvent = this.endDrawing.bind(this)
    this.cnv.addEventListener('mousedown', this.downEvent)
    this.cnv.addEventListener('mousemove', this.moveEvent)
    this.cnv.addEventListener('mouseout', this.upEvent)
    this.cnv.addEventListener('mouseup', this.upEvent)
  }

  /** Sets the function used to draw on the canvas
   * @param {DrawFunc} drawFunc - a procedure which takes x, y and pointer pressure and draws on the canvas
   */
  setDrawFunc(drawFunc) {
    this.drawFunc = function () {
      if (this.mp > 0) {
        drawFunc(this.mx, this.my, this.mp)
      }
      if (this.drawing) window.requestAnimationFrame(this.drawFunc)
    }.bind(this)
  }

  startDrawing(e) {
    this.drawing = true
    window.requestAnimationFrame(this.drawFunc)
    this.mp = e.pressure
  }

  moveBrush(e) {
    let rect = e.target.getBoundingClientRect()
    this.mx = e.clientX - rect.left // x position within the element.
    this.my = e.clientY - rect.top // y position within the element.
    this.mp = 1
  }

  endDrawing(e) {
    this.drawing = false
  }

  release() {
    this.cnv.removeEventListener('pointerdown', this.downEvent)
    this.cnv.removeEventListener('pointermove', this.moveEvent)
    this.cnv.removeEventListener('pointerup', this.upEvent)
  }
}
