(function(global) {
  let id = 0
    /** Allows assertions to be tested with custom error messages
     * Also stops the execution of the current function
     * @param {Boolean} pre - a precondition to test
     * @param {String} msg - a message to provide on failed precondition
     */
  global.assert = function(pre, msg) {
    if (!pre) console.error(msg || `Assertion failed! [${id++}]`)
  }

  /** Wraps a function to free the this reference from d3's binding and
   * assigns it to another argument within the function, intended to be
   * called elem or self
   * @param {Function} f - the function to wrap
   */
  global.d3bind = function(f) {
    let scope = this
    return function(...args) {
      return f.call(scope, this, ...args)
    }
  }
})(this)