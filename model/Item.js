
var Swarm = require("swarm");

var Item = Swarm.Model.extend("Item", {

    defaults: {
        startX: 0,
        startY: 0,
        points: [],
        color: "#FFF",
        transform: []
    },

    pan: function (tx, ty) {

    },

    getBBox: function () {

        var self = this;
        var maxX = 0;
        var maxY = 0;

        this.toPoints().forEach(function (point)
        {
            var x = Math.abs(point[0]);
            var y = Math.abs(point[1]);

            if (x > maxX)
            {
                maxX = x;
            }

            if (y > maxY)
            {
                maxY = y;
            }
        });

        return {
            x: self.startX,
            y: self.startY,
            width: Math.abs(self.startX - maxX),
            height: Math.abs(self.startY - maxY)
        };
    },

    toPoints: function () {

        var self = this;

        var convert = function (point)
        {
            return [
                self.startX - point[0],
                self.startY - point[1]
            ]
        };

        return this.points.map(convert);
    }
});

module.exports = Item;
