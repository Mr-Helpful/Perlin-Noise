class Perlin{
  constructor(fData, lFunc){
    this.tableSize = 256
    this.lFunc = lFunc
    this.perlinVals = []
    fData.forEach(d => this.addLevel(d))
  }

  printLevels(){
    console.log(this.perlinVals.map(v => v.slice(0,2)))
  }

  zip(rows){
    return rows[0].map((_, c) => rows.map(row => row[c]))
  }

  getData(dDims, transform){
    let perlinData = this.perlinVals.map(pDatum => {
      return this.queryPoints(pDatum, dDims)
    })
    return this.zip(perlinData).map(r => {
      return r.reduce((v,d) => {
        v["v"] += d["v"]
        return v
      })
    })
  }

  getMaxVal(){
    return this.perlinVals.reduce((a, b) => a + b[1], 0) * 2**1.5
  }

  addLevel(fDatum){
    this.perlinVals.push(this.getLevel(fDatum))
  }

  updateLevel(fDatum){
    let [i, d] = this.fIndex(fDatum[0])
    if(i == -1){
      console.log("ERROR: Trying to edit a non-existant layer.")
      console.log("This shouldn't happen, adding a new layer instead")
      this.addLevel(fDatum)
    }
    else if(fDatum[1] == d[1]){
      this.perlinVals[i] = this.getLevel(fDatum)
    }
    else{
      this.perlinVals[i][1] = fDatum[1]
    }
  }

  removeLevel(fDatum){
    this.perlinVals = this.perlinVals.filter(d => d[0] != fDatum[0])
  }

  getLevel(fDatum){
    return [...fDatum, this.generateHashes(), this.generateVecs()]
  }

  fIndex(f){
    return this.perlinVals.reduce((x, v, i) => v[0]==f?i:[x, v], -1)
  }

  generateVecs(){
    let v = new Array(this.tableSize).fill(0)

    function genVec(v, i){
      let a = Math.random() * Math.PI * 2
      let x = Math.sin(a)
      let y = Math.cos(a)
      return [x, y]
    }

    return v.map(genVec)
  }

  generateHashes(){
    let h = new Array(this.tableSize).fill(0)

    h = h.map((v, i) => i)
    h.forEach((v, i) => {
      let j = Math.floor(Math.random() * h.length)
      h[i] = h[j]
      h[j] = v
    })

    // this simply doubles the array
    h.push(...h)
    return h
  }

  queryPoints(perlin, dDims){
    let iFunc = (x, y) => this.index(...(perlin.slice(-2)), x, y)
    let [f, A] = perlin.slice(0, 2)
    let pQuery = (x, y) => this.query(f, A, iFunc, this.lFunc, this.tableSize, x, y)


    let [w, h] = dDims
    w = new Array(w).fill(0)
    h = new Array(h).fill(0)

    // setting up a blank array of points to be filled
    let points = []

    // using a forEach method is quicker than a for loop
    w.forEach((_, x) => {
      h.forEach((_, y) => {
        points.push({"x":x,
                     "y":y,
                     "v":pQuery(x, y)})
        })
      })


    return points
  }

  index(hash, vecs, x, y){
    return vecs[hash[hash[x] + y]]
  }

  splitInt(v, f, tableSize){
    v *= f
    v %= tableSize
    let t = Math.floor(v)
    v -= t
    return [t, (t + 1) % tableSize, v]
  }

  query(f, A, iFunc, lFunc, tableSize, x, y){
    let [x1, x2, xf] = this.splitInt(x, f, tableSize)
    let [y1, y2, yf] = this.splitInt(y, f, tableSize)

    let v11, v12, v21, v22
    v11 = iFunc(x1, y1)
    v12 = iFunc(x1, y2)
    v21 = iFunc(x2, y1)
    v22 = iFunc(x2, y2)

    v11 = this.dot(...v11, xf, yf)
    v12 = this.dot(...v12, xf, 1-yf)
    v21 = this.dot(...v21, 1-xf, yf)
    v22 = this.dot(...v22, 1-xf, 1-yf)

    v11 = this.lerp(v11, v21, lFunc(xf))
    v12 = this.lerp(v12, v22, lFunc(xf))
    return A * this.lerp(v11, v12, lFunc(yf))
  }

  dot(x1, y1, x2, y2){
    return x1*x2 + y1*y2
  }

  lerp(v1, v2, t){
    return v1 * t + v2 * (1-t)
  }

}

let fData = [[1, 1],
             [16, 1/16],
             [256, 1/256]]

let lFuncs = {"cubic":t => 3*t**2 - 2*t**3,
              "quint":t => 6*t**5 - 15*t**4 + 10*t**3}

let perlin = new Perlin(fData, lFuncs["quint"])
perlin.printLevels()

perlin.updateLevel([16, 1/4])
perlin.printLevels()

perlin.addLevel([64, 1])
perlin.printLevels()

perlin.removeLevel([16, -1])
perlin.printLevels()
