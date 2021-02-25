/*
 * A module extending the d3 class to allow generation of basic menus
 *
 * This adds a menu method to d3, to which:
 * > menu items can be added, with callbacks
 * > menu items can be removed by name
 * > menu items can be made default, pushing them to the top of the menu
 *
 * Styling for this menu is included in a seperate file and follows the style
 * used in: <url here>
 */

// This assumes that a d3 import has been performed in the html
/*
  TODO:

  > implement menu as a class
   > try to implement d3's method chaining
    > use this to
     {practical}
     > add new values to the menu
     > remove values from the menu
     > add a new item which opens the menu
     > remove an item which opens the menu
     > change the default option of the menu
     {aesthetic}
     > change the outline colour of the wedges
     > change the fill colour of the wedges
     > change the opacity of the wedges

  > find a good way to change the default option
   > allow the user to specify the name in the current values
    > firstly add the previous default back into options
     > it's probably more efficient just to swap the names and callbacks of the options
    > remove the value from the options when you do this
     > we don't want it to show up twice
    > throw an error if the name does not exist in the values
*/

(function(global){
  global.d3.menu = function(){
    let menuClass = "d3-context-menu"

    let scope
    let div = d3.select("body")
                .append("div")
                .attr("class", menuClass)

    let mList = div.append("ol")

    d3.select("body")
      .on("mouseup", (function(){
        div.style("display", "none")
      }).bind(this))

    function menu(elem){
      elem.on("contextmenu", function(d, i, j){
        d3.event.preventDefault()
        scope = [this, d, i, j]

        div.style("left", (d3.event.pageX - 2) + "px")
           // we move the div up two extra pixels to ensure that if right clicked rapidly, the context menu will select the default
  			   .style("top", (d3.event.pageY - 4) + "px")
           .style("display", "block")
      })
    }

    menu.addEntry = function(name, callback){
      mList.append("li")
           .attr("id", name)
           .html(name)
           .on("mouseup", (function(){
             // we can't use apply here as it takes the scope seperately
             callback.call(...scope)
           }).bind(this))

      return menu
    }

    menu.removeEntry = function(name){
      // we need to enclose the name in '' in case the name contains special characters
      let entry = mList.select("li[id='" + name + "']")
      if(entry.node()){
        entry.remove()
        return menu
      }
      console.warn("The entry '"+name+"' does not exist in the context menu")
      return menu
    }

    menu.makeDefault = function(name){
      // we need to enclose the name in '' in case the name contains special characters
      let entry = mList.select("li[id='" + name + "']")
      if(entry.node()){
        mList.insert(function(){return entry.remove().node()}, "li")
        return menu
      }
      console.warn("The entry '"+name+"' does not exist in the context menu")
      return menu
    }

    function hideMenu(){
    }

    return menu
  }
})(this)

/*
Positioning:
------------------------
.menu {
  top: mX;
  left: mY;
  position: absolute;
}

Hiding:
------------------------
function myFunction() {
  var x = document.getElementById("myDIV");
  if (x.style.display === "none") {
    x.style.display = "block";
  } else {
    x.style.display = "none";
  }
}
*/
