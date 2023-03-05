// credit to:
// Denise Mauldin (draggable line graph)
// https://bl.ocks.org/denisemauldin/538bfab8378ac9c3a32187b4d7aed2c2

export class Levels {
  constructor(perlin, controls, defaults, defaultLevel) {
    this.perlin = perlin
    this.controls = controls
    this.defaultLevels = defaults.points
    this.points = []
    this.svg = d3.select('#Levels')

    const { left, right, top, bottom } = defaults.margins
    const w = this.svg.attr('width') - left - right
    const h = this.svg.attr('height') - top - bottom
    const transform = `translate(${left},${top})`

    this.focus = this.svg.append('g').attr('transform', transform)
    this.x = d3.scaleLinear().rangeRound([0, w]).domain([0, 8])
    this.y = d3.scaleLinear().rangeRound([h, 0]).domain([-20, 0]).clamp(true)

    createAxis(this.focus, [w, h], this.x, this.y)

    this.focus.append('path').attr('class', 'graph line')
    this.line = d3
      .line()
      .x(d => this.x(d[0]))
      .y(d => this.y(d[1]))

    const gap = this.svg.attr('width') / this.defaultLevels.length
    this.svg
      .selectAll('.graph.defaults')
      .data(this.defaultLevels)
      .enter()
      .append('circle')
      .attr('class', 'graph defaults')
      .attr('id', d => `#default_${d.label}`)
      .attr('cx', (_, i) => gap * (i + 0.5))
      .attr('cy', 20)
      .style('fill', d => d.colour)
      .style('stroke', 'black')
      .call(this.tooltip)
      .on('click', d => this.setDefault(d))

    this.setDefault(this.defaultLevels[defaultLevel])
  }

  get drag() {
    // controls the dragging of individual points and the map redrawing
    // necessary for these.
    // we define interval to "debounce" (not really) the redrawMap calls
    let redrawing = false
    let graph = this

    function dragstarted() {
      d3.select(this).raise().classed('active', true)
      redrawing = true
      window.requestAnimationFrame(redraw)
    }

    function dragged(d) {
      d[1] = graph.y.invert(d3.event.y)
      d3.select(this).attr('cy', d3.event.y)

      graph.setControls(d)
      graph.focus.select('.graph.line').attr('d', graph.line)
      graph.perlin.editLevel(d)
    }

    function dragended() {
      redrawing = false
      d3.select(this).classed('active', false)
    }

    function redraw() {
      graph.perlin.redrawMap()
      if (redrawing) window.requestAnimationFrame(redraw)
    }

    return d3
      .drag()
      .on('start', dragstarted)
      .on('drag', dragged)
      .on('end', dragended)
  }

  get tooltip() {
    const tip = d3.select('.graph.tip')
    return elem =>
      elem
        .on('mouseover', function ({ tooltip }) {
          tip
            .html(tooltip)
            .style('display', 'block')
            .style('left', d3.event.pageX + 5 + 'px')
            .style('top', d3.event.pageY + 5 + 'px')
        })
        .on('mouseout', function () {
          tip.style('display', 'none')
        })
  }

  get menu() {
    return d3
      .menu()
      .addEntry('Delete level', d => this.removePoint(d))
      .addEntry('Reset level', d => this.perlin.resetLevel(d))
      .makeDefault('Reset level')
  }

  updateGraph(i = -1) {
    const T = 500 //ms

    let graph_line = this.focus.select('.graph.line')
    let graph_points = this.focus.selectAll('.graph.points')
    if (i != -1) {
      graph_line
        .datum(this.points, d => d[0])
        .transition()
        .duration(T)
        .attr('d', this.line)

      this.points.splice(i, 1)
    }

    graph_line
      .datum(this.points, d => d[0])
      .on('click', d => this.addPoint(d))
      .transition()
      .duration(0)
      .delay(T)
      .attr('d', this.line)

    graph_points
      .data(this.points, d => d[0])
      .join(
        enter =>
          enter
            .append('circle')
            .attr('class', 'graph points')
            .attr('r', 5.0)
            .attr('cx', d => this.x(d[0]))
            .attr('cy', d => this.y(d[1]))
            .each(d => this.perlin.addLevel(d))
            .call(enter => enter.transition().duration(T).style('opacity', 1))
            .call(this.drag)
            .on('mouseover', this.setControls.bind(this))
            .call(this.menu),
        update =>
          update
            .each(d => this.perlin.editLevel(d))
            .call(update =>
              update
                .transition()
                .duration(T)
                .attr('cy', d => this.y(d[1]))
            ),
        exit =>
          exit
            .each(d => this.perlin.delLevel(d))
            .call(exit =>
              exit.transition().duration(T).style('opacity', 0).remove()
            )
      )

    this.perlin.redrawMap()
  }

  // updates the Levels graph with one of the default set of points
  setDefault(d) {
    // unselect all default circles
    this.svg.selectAll('.graph.defaults').attr('r', 5)
    // select the clicked on circle
    this.svg.selectAll(`#default_${d.label}`).attr('r', 3.5)

    this.points = d.points
    // if it's not the custom setting
    console.log(d.label)
    if (d.label != 'Custom') {
      console.log('Custom level not selected')
      // then we perform a shallow copy to prevent the preset from being edited
      // the default points given are a nested list
      // so we need to perform a copy on two layers
      this.points = this.points.map(v => [...v])
    }

    this.updateGraph()
  }

  setControls(d) {
    let [[f, A, s], _] = this.perlin.fetchLevel(2 ** d[0])
    this.controls.select('#freq').html(f.toExponential(3))
    this.controls.select('#ampl').html(A.toExponential(3))
    this.controls.select('#seed').html(s.toExponential(3))
    this.controls.select('#delete').on('click', d => this.addPoint(d))
    this.controls
      .select('#reset')
      .on('click', this.perlin.resetLevel.bind(this.perlin, d))
  }

  addPoint(d) {
    d3.event.preventDefault()
    let [mx, my] = d3.mouse(this.focus.select('.graph.line').node())
    d = [this.x.invert(mx), this.y.invert(my)]

    this.points.push(d)
    this.points.sort((a, b) => a[0] - b[0])
    this.updateGraph()
  }

  removePoint(d) {
    d3.event.preventDefault()
    let i = this.points.indexOf(d)

    const N = this.points.length - 1
    if (i <= 0) return console.warn("the first point can't be removed")
    if (i >= N) return console.warn("the last point can't be removed")

    this.points = flattenPoint(this.points, i)
    this.updateGraph(i)
  }
}

function flattenPoint(points, i) {
  const x = points[i][0]
  const [x1, y1] = points[i - 1]
  const [x2, y2] = points[i + 1]
  const t = (x - x1) / (x2 - x1)
  let y = y2 * t + y1 * (1 - t)
  points[i][1] = y
  return points
}

/* creates both axis for the line graph */
function createAxis(focus, dims, x, y) {
  // sets up the displayed x axis
  focus
    .append('g')
    .attr('class', 'axis axis--x')
    .attr('transform', 'translate(0,' + dims[1] + ')')
    .call(d3.axisBottom(x))

  // adds the "frequency" text label to the x-axis and positions it correctly
  focus
    .append('text')
    .attr('class', 'x label')
    .attr('text-anchor', 'top')
    .attr('x', dims[0] / 2 - 50)
    .attr('y', dims[1] + 40)
    .text('Frequency (log2)')

  // sets up the displayed y axis
  focus.append('g').attr('class', 'axis axis--y').call(d3.axisLeft(y))

  // adds the "frequency" text label to the x-axis and positions it correctly
  focus
    .append('text')
    .attr('class', 'y label')
    .attr('text-anchor', 'top')
    .attr('transform', 'rotate(-90)')
    .attr('x', -dims[1] / 2 - 50)
    .attr('y', -30)
    .text('Amplitude (log2)')
}
