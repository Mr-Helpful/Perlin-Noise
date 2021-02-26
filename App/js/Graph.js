// credit to:
// Denise Mauldin (draggable line graph)
// https://bl.ocks.org/denisemauldin/538bfab8378ac9c3a32187b4d7aed2c2

function initLevels(perlin, defaults, defaultLevel){
  let defaultLevels = defaults["points"],
      points = [],
      svg = d3.select("#Levels"),
      margin = defaults["margins"],
      width = +svg.attr("width") - margin.left - margin.right,
      height = +svg.attr("height") - margin.top - margin.bottom,
      focus = svg.append("g")
                 .attr("transform", "translate(" + margin.left + "," + margin.top + ")")

  let x = d3.scaleLinear()
            .rangeRound([0, width])
            .domain([0, 8])

  let y = d3.scaleLinear()
            .rangeRound([height, 0])
            .domain([-20, 0])
            .clamp(true)

  createAxis(focus, [width, height], x, y)//>

  focus.append("path")
       .attr("class", "graph line")

  let line = d3.line()
               .x(function(d){return x(d[0])})
               .y(function(d){return y(d[1])})

  let drag = d3.drag()
               .on('start', dragstarted)
               .on('drag', dragged)
               .on('end', dragended)

  let menu = d3.menu()
               .addEntry("Delete level", removePoint)
               .addEntry("Reset level", perlin.resetLevel.bind(perlin))
               .makeDefault("Delete level")

  function updateGraph(i = -1){
    T = 500
    const t = focus.transition()
                   .duration(T)

    let p = focus.select(".graph.line")
    let c = focus.selectAll('.graph.points')
    if(i != -1){
      p.datum(points, d => d[0])
       .transition(t)
       .attr("d", line)

      points.splice(i, 1)
    }
    p.datum(points, d => d[0])
     .on("click", addPoint)
     .transition()
     .duration(0)
     .delay(T)
     .attr("d", line)

    c.data(points, d => d[0])
     .join(enter => enter.append('circle')
                         .attr("class", "graph points")
                         .attr('r', 5.0)
                         .attr('cx', d => x(d[0]))
                         .attr('cy', d => y(d[1]))
                         .each(d => perlin.addLevel(d))
                         .call(enter => {
                         return enter.transition(t)
                                     .style("opacity", 1)})
                         .call(drag)
                         .call(menu),
           update => update.each(d => perlin.editLevel(d))
                           .call(update => {
                           return update.transition(t)
                                        .attr('cx', d => x(d[0]))
                                        .attr('cy', d => y(d[1]))
                           }),
           exit => exit.each(d => perlin.delLevel(d))
                       .call(exit => {
                       return exit.transition(t)
                                  .style("opacity", 0)
                                  .remove()}))

    perlin.redrawMap()
  }

  function addPoint(d){
    d3.event.preventDefault()
    let coords = d3.mouse(this)

    d = [x.invert(coords[0]),
         y.invert(coords[1])]

    points.push(d)
    points.sort((a, b) => a[0] - b[0])
    updateGraph()
  }

  function removePoint(d){
    d3.event.preventDefault()

    let i = points.indexOf(d)

    if(i <= 0){
      console.warn("removing the first point is not possible")
      return
    }

    if(i >= points.length - 1){
      console.warn("removing the last point is not possible")
      return
    }

    if(i > 0 && i < points.length - 1){
      points = flattenPoint(points, i)
      updateGraph(i)
    }
  }

  function flattenPoint(points, i){
    const x = points[i][0]
    const [x1, y1] = points[i - 1]
    const [x2, y2] = points[i + 1]
    const t = (x - x1) / (x2 - x1)
    let y = y2 * t + y1 * (1 - t)
    points[i][1] = y
    return points
  }

  // controls the dragging of individual points and the map redrawing
  // necessary for these
  let inter
  function dragstarted(d){
    d3.select(this).raise().classed('active', true)
    inter = setInterval(perlin.redrawMap.bind(perlin), 1/50)
  }

  function dragged(d, i){
    d[1] = y.invert(d3.event.y)
    d3.select(this)
      .attr('cy', y(d[1]))
    focus.select('.graph.line').attr('d', line)
    perlin.editLevel(d)
  }

  function dragended(d){
    clearInterval(inter)
    d3.select(this).classed('active', false)
  }

  // updates the Levels graph with one of the default set of points
  function setDefault(d, i){
    svg.selectAll(".graph.defaults").attr("stroke", "black")
    svg.select("#default" + i).attr("stroke", "white")

    points = d.points
    // if it's not the custom setting
    if(d.label != "Custom"){
      // then we perform a shallow copy to prevent the preset from being edited
      // the default points given are a nested list
      // so we need to perform a copy on two layers
      points = points.map(v => [...v])
    }

    updateGraph()
  }

  w = +svg.attr("width")/defaultLevels.length
  tip = d3.select(".graph.tip")
  svg.selectAll(".graph.defaults")
     .data(defaultLevels)
     .enter()
     .append("circle")
     .attr("class", "graph defaults")
     .attr("id", (d, i) => "default" + i)
     .attr("r", 5)
     .attr("cx", (_, i) => w*(i + 0.5))
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
     .on("click", d => setDefault(d))

  setDefault(defaultLevels[defaultLevel], defaultLevel)
}

/* creates both axis for the line graph */
function createAxis(focus, dims, x, y){
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
