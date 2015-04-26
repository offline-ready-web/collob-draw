
var Rx = require("rx");
var Hammer = require("hammerjs")

var InputHandler = function (element)
{
    this.element = element;

    this.mc = Hammer(element, {
        touchAction: "auto"
    });
};

InputHandler.prototype.getStream = function ()
{
    var eventsList = "pan tap doubletap press";

    this.mc.get('pan').set({ direction: Hammer.DIRECTION_ALL });

    return Rx.Observable.create(function (observer) {

        this.mc.on(eventsList, function (e) {

            // Yield a single value and complete
            observer.onNext(e);
        });

        // Any cleanup logic might go here
        return function ()
        {
            console.log("Disposed");
        };
    }.bind(this))
    .map(this.toPoint);
};

InputHandler.prototype.toPoint = function (event) {

    return {
        x: event.center.x,
        y: event.center.y
    };
};

module.exports = InputHandler;