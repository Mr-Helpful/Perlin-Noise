// credit to:
// Denise Mauldin (draggable line graph)
// https://bl.ocks.org/denisemauldin/538bfab8378ac9c3a32187b4d7aed2c2

function Levels(perlin, controls, defaults, defaultLevel) {
  this.perlin = perlin
  this.defaultLevels = defaults.points
  this.points = []
  this.svg = d3.select("#Levels")
  this.margin = defaults["margins"]
  this.width = +this.svg.attr("width") - this.margin.left - this.margin.right
  this.height = +this.svg.attr("height") - this.margin.top - this.margin.bottom

  this.focus = this.svg.append("g")
    .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")")

  this.x = d3.scaleLinear()
    .rangeRound([0, this.width])
    .domain([0, 8])

  this.y = d3.scaleLinear()
    .rangeRound([this.height, 0])
    .domain([-20, 0])
    .clamp(true)

  createAxis(this.focus, [this.width, this.height], this.x, this.y) //>

  this.focus.append("path")
    .attr("class", "graph line")

  this.line = d3.line()
    .x(function(d) { return this.x(d[0]) })
    .y(function(d) { return this.y(d[1]) })

  this.drag = getDrag.call(this)
  this.pointOps = getPointOps.call(this)

  this.menu = d3.menu()
    .addEntry("Delete level", this.pointOps.rem)
    .addEntry("Reset level", this.perlin.resetLevel.bind(this.perlin))
    .makeDefault("Reset level")

  this.updateGraph = function(i = -1) {
    const T = 500 //ms

    let p = this.focus.select(".graph.line")
    let c = this.focus.selectAll('.graph.points')
    if (i != -1) {
      p.datum(this.points, d => d[0])
        .transition()
        .duration(T)
        .attr("d", this.line)

      this.points.splice(i, 1)
    }
    p.datum(this.points, d => d[0])
      .on("click", this.pointOps.add)
      .transition()
      .duration(0)
      .delay(T)
      .attr("d", this.line)

    c.data(this.points, d => d[0])
      .join(enter => enter.append('circle')
        .attr("class", "graph points")
        .attr('r', 5.0)
        .attr('cx', d => this.x(d[0]))
        .attr('cy', d => this.y(d[1]))
        .each(d => perlin.addLevel(d))
        .call(enter => {
          return enter.transition()
            .duration(T)
            .style("opacity", 1)
        })
        .call(this.drag)
        .on("mouseover", this.setControls.bind(this))
        .call(this.menu),
        update => update.each(d => perlin.editLevel(d))
        .call(update => {
          return update.transition()
            .duration(T)
            .attr('cx', d => this.x(d[0]))
            .attr('cy', d => this.y(d[1]))
        }),
        exit => exit.each(d => perlin.delLevel(d))
        .call(exit => {
          return exit.transition()
            .duration(T)
            .style("opacity", 0)
            .remove()
        }))

    perlin.redrawMap()
  }

  this.setControls = function(d) {
    let [
      [f, A, s], _
    ] = perlin.fetchLevel(2 ** d[0])
    controls.select("#freq")
      .html(f.toExponential(3))
    controls.select("#ampl")
      .html(A.toExponential(3))
    controls.select("#seed")
      .html(s.toExponential(3))
    controls.select("#delete")
      .on("click", this.pointOps.rem.bind(this, d))
    controls.select("#reset")
      .on("click", this.perlin.resetLevel.bind(this.perlin, d))
  }

  // updates the Levels graph with one of the default set of points
  function setDefault(d, i) {
    // unselect all default circles
    this.svg.selectAll(".graph.defaults")
      .attr("r", 5)
      // select the clicked on circle
    this.svg.selectAll("#default" + i)
      .attr("r", 3.5)

    this.points = d.points
      // if it's not the custom setting
    if (d.label != "Custom") {
      // then we perform a shallow copy to prevent the preset from being edited
      // the default points given are a nested list
      // so we need to perform a copy on two layers
      this.points = this.points.map(v => [...v])
    }

    this.updateGraph()
  }

  w = +this.svg.attr("width") / this.defaultLevels.length
  tip = d3.select(".graph.tip")
  this.svg.selectAll(".graph.defaults")
    .data(this.defaultLevels)
    .enter()
    .append("circle")
    .attr("class", "graph defaults")
    .attr("id", (d, i) => "default" + i)
    .attr("cx", (_, i) => w * (i + 0.5))
    .attr("cy", 20)
    .style("fill", d => d.colour)
    .style("stroke", "black")
    .on("mouseover", function(d) {
      let elem = d3.select(this)
      tip.html(d.cLabel + " noise")
        .style("display", "block")
        .style("left", d3.event.pageX + 5 + "px")
        .style("top", d3.event.pageY + 5 + "px")
    })
    .on("mouseout", function(d) {
      tip.style("display", "none")
    })
    .on("click", setDefault)

  setDefault(this.defaultLevels[defaultLevel], defaultLevel)
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
  focus.append('g')
    .attr('class', 'axis axis--x')
    .attr('transform', 'translate(0,' + dims[1] + ')')
    .call(d3.axisBottom(x))

  // adds the "frequency" text label to the x-axis and positions it correctly
  focus.append("text")
    .attr("class", "x label")
    .attr("text-anchor", "top")
    .attr("x", dims[0] / 2 - 50)
    .attr("y", dims[1] + 40)
    .text("Frequency (log2)")

  // sets up the displayed y axis
  focus.append('g')
    .attr('class', 'axis axis--y')
    .call(d3.axisLeft(y))

  // adds the "frequency" text label to the x-axis and positions it correctly
  focus.append("text")
    .attr("class", "y label")
    .attr("text-anchor", "top")
    .attr("transform", "rotate(-90)")
    .attr("x", -dims[1] / 2 - 50)
    .attr("y", -30)
    .text("Amplitude (log2)")
}

function getDrag() {
  // store some scope as d3 sets the 'this' reference
  let scope = this

  // controls the dragging of individual points and the map redrawing
  // necessary for these.
  // we define interval to "debounce" (not really) the redrawMap calls
  let redrawing = false

  function dragstarted(d) {
    d3.select(this).raise().classed('active', true)
    redrawing = true
    window.requestAnimationFrame(redraw)
  }

  function dragged(d, i) {
    d[1] = scope.y.invert(d3.event.y)
    scope.setControls(d)
    d3.select(this)
      .attr('cy', y(d[1]))
    scope.focus.select('.graph.line').attr('d', scope.line)
    scope.perlin.editLevel(d)
  }

  function dragended(d) {
    redrawing = false
    d3.select(this).classed('active', false)
  }

  function redraw() {
    scope.perlin.redrawMap()
    if (redrawing) window.requestAnimationFrame(redraw)
  }

  return d3.drag()
    .on('start', dragstarted)
    .on('drag', dragged)
    .on('end', dragended)
}

function getPointOps() {
  let scope = this // save scope

  function addPoint(d) {
    d3.event.preventDefault()
    let coords = d3.mouse(this)

    d = [
      scope.x.invert(coords[0]),
      scope.y.invert(coords[1])
    ]

    scope.points.push(d)
    scope.points.sort((a, b) => a[0] - b[0])
    scope.updateGraph()
  }

  function removePoint(d) {
    d3.event.preventDefault()

    let i = scope.points.indexOf(d)

    if (i <= 0) {
      console.warn("removing the first point is not possible")
      return
    }

    if (i >= scope.points.length - 1) {
      console.warn("removing the last point is not possible")
      return
    }

    if (i > 0 && i < scope.points.length - 1) {
      scope.points = scope.flattenPoint(scope.points, i)
      scope.updateGraph(i)
    }
  }

  return {
    "add": addPoint,
    "rem": removePoint
  }
}