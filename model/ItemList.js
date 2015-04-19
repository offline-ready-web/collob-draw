
var Swarm = require("swarm");
var Item  = require("./Item");

var ItemList = Swarm.Vector.extend("ItemList", {

    objectType: Item
});

module.exports = ItemList;
