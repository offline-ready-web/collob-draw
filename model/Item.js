
var Swarm = require("swarm");

var Item = Swarm.Model.extend("Item", {

    defaults: {
        points: [],
        transform: [],
    },

    pan: function (tx, ty) {

    }
});

module.exports = Item;
