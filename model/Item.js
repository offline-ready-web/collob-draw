
var Swarm = require("swarm");

var Item = Swarm.Model.extend("Item", {

    defaults: {
        startX: 0,
        startY: 0,
        points: [],
        transform: [],
    },

    pan: function (tx, ty) {

    }
});

module.exports = Item;
