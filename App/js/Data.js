const points = [
  {
    label: 'Custom',
    tooltip: 'Custom noise',
    colour: '#0c6',
    points: [
      [0, 0],
      [8, 0]
    ]
  },
  {
    label: 'Violet',
    tooltip: 'Violet noise',
    colour: '#60c',
    points: [
      [0, -20],
      [2, -16],
      [4, -12],
      [6, -8],
      [8, -4]
    ]
  },
  {
    label: 'Blue',
    tooltip: 'Blue noise',
    colour: '#33f',
    points: [
      [0, -10],
      [2, -8],
      [4, -6],
      [6, -4],
      [8, -2]
    ]
  },
  {
    label: 'White',
    tooltip: 'White noise',
    colour: '#fff',
    points: [
      [0, 0],
      [2, 0],
      [4, 0],
      [6, 0],
      [8, 0]
    ]
  },
  {
    label: 'Pink',
    tooltip: 'Pink noise',
    colour: '#c0c',
    points: [
      [0, 0],
      [2, -2],
      [4, -4],
      [6, -6],
      [8, -8]
    ]
  },
  {
    label: 'Brown',
    tooltip: 'Brown noise',
    colour: '#963',
    points: [
      [0, 0],
      [2, -4],
      [4, -8],
      [6, -12],
      [8, -16]
    ]
  }
]
const margins = { top: 50, right: 20, bottom: 50, left: 50 }

const kernelFuncs = {
  linear: t => t,
  quadra: t => t * t,
  smooth: t => 6 * t ** 5 - 15 * t ** 4 + 10 * t ** 3
}
const brush = {
  small: circleKernel(8, kernelFuncs.smooth),
  medium: circleKernel(14, kernelFuncs.smooth),
  large: circleKernel(20, kernelFuncs.smooth)
}
const colourScales = {
  viridis: [
    '#440154',
    '#482878',
    '#3e4989',
    '#31688e',
    '#26828e',
    '#1f9e89',
    '#35b779',
    '#6ece58',
    '#b5de2b',
    '#fde725'
  ],
  earth: ['#100154', '#1161b8', '#52c0d9', '#6ed63a', '#a5d98b', '#ffffff']
}

export default {
  levels: {
    points,
    margins
  },
  heatmap: {
    kernelFuncs,
    brush,
    colourScales
  }
}

// generates a circular kernel with the given radius and fade function
export function circleKernel(r, fade = t => 1) {
  r--
  let l = 2 * r + 1
  return [...Array(l).keys()].map(y => {
    return [...Array(l).keys()].map(x => {
      let t = 1 - Math.sqrt((x - r) * (x - r) + (y - r) * (y - r)) / r
      return t < 0 ? 0 : fade(t)
    })
  })
}
