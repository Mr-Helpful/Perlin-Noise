/*
 * A simple library whose end goal is to produce the function hexFade.
 *
 * hexFade takes a list of hex strings
 * and returns the function multiFade
 *
 * multiFade takes a value from 0->1, with error checking to clamp to this range
 * and returns a rgba list
 */

(function(global){
  var module = global.fades = {}

  // performs a linear interpolation between two rgba colours
  // s - the starting colour
  // e - the ending colour
  // t - the value from 0 -> 1 to interpolate for
  function fadeScale(s, e, t){
    return s.map((x, i) => Math.floor(x*(1-t)+e[i]*t))
  }

  // this function does the main work of the module
  // it takes:
  // shades - list of rgba lists
  // t - the value (0 -> 1) to produce a shade for
  // and returns:
  // an rgba value
  // this function assumes all the shades are equally spaced
  function multiFade(shades, t){
    // clamps the value and stretches it to the range 0 -> shades.length - 1
    let f = Math.max(Math.min(t, 0.9999), 0) * (shades.length - 1)
    t = Math.floor(f)
    return fadeScale(shades[t], shades[t + 1], f-t)
  }

  // a helper function to convert a hex string to a rgba list
  function hexToRgba(hex){
    return [parseInt(hex.slice(1, 3), 16),
            parseInt(hex.slice(3, 5), 16),
            parseInt(hex.slice(5, 7), 16),
            255]
  }

  // takes a list of hex strings and returns a fade function
  module.hexFade = function(hexList){
    let shades = hexList.map(hexToRgba)
    return multiFade.bind(null, shades)
  }
})(this)
