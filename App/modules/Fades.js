/*
 * A module which creates fade functions for use in design
 */

/**
 * performs a linear interpolation between two rgba colour Arrays
 * @param {Array} s - the starting colour
 * @param {Array} e - the ending colour
 * @param {Float} t - the value from 0 -> 1 to interpolate for
 * @return {Array} the result of linear interpolation between s and e using t
 */
export function fadeScale(s, e, t) {
  return s.map((x, i) => Math.floor(x * (1 - t) + e[i] * t))
}

/**
 * this function does the main work of the module
 * @param {Array} shades - list of rgba lists
 * @param {Float} t - the value (0 -> 1) to produce a shade for
 * @return {Array} an rgba list
 * this function assumes all the shades are equally spaced
 */
function multiFade(shades, t) {
  // clamps the value and stretches it to the range 0 -> shades.length - 1
  let f = Math.max(Math.min(t, 0.9999), 0) * (shades.length - 1)
  t = Math.floor(f)
  return fadeScale(shades[t], shades[t + 1], f - t)
}

/**
 * a helper function to convert a hex string to a rgba Array
 * @param {String} hex - a single hexadecimal colour code
 * @return {Array} an rgba Array
 */
function hexToRgba(hex) {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
    255
  ]
}

/**
 * a helper function to convert an rgba Array to a hex string
 * @param {Array} rgba - a single rgba Array
 * @return {String} a hexadecimal colour code
 */
function rgbaToHex(rgba) {
  return (
    '#' + rgba[0].toString(16) + rgba[1].toString(16) + rgba[2].toString(16)
  )
}

/**
 * takes a list of hex strings and returns a fade function
 * @param {Array} hexList - an Array of hexadecimal colour codes to fade between
 * @return {Function} a fade function in the form of a multiFade
 */
export function hexFade(hexList) {
  let shades = hexList.map(hexToRgba)
  return multiFade.bind(null, shades)
}
