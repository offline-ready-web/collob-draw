
var Hammer = require("hammerjs");
var Rx = require("rx");

var SwarmApp = require("./SwarmApp");
var User = require("../model/User");
var Item = require("../model/Item");
var ItemList = require("../model/ItemList");

// Refactor into separate class
var canvasEl = document.getElementById("kanvas");
var wsServer = "ws://localhost:8000/";
var canvasId = location.hash.replace("#", "") || "global";
var color;
var hammer;
var context;
var app;
var user;
var items;

function main ()
{
    // Swarm setup
    app = new SwarmApp();
    app.init(wsServer);
    app.addListeners();

    user = new User(app.getAppId());

    // Hammer responsible for the touch events
    hammer = new Hammer(canvasEl);

    var size = {
        width: window.innerWidth,
        height: window.innerHeight
    };
    setCanvasSize(size);

    context = canvasEl.getContext("2d");

    var handleItemsDraw = function (items)
    {
        // Draw all items
        items.forEach(function (item)
        {
            var x = item.startX || 0;
            var y = item.startY || 0;

            item.points.forEach(function (point)
            {
                var calcPoint = {
                    x: x - point.dx,
                    y: y - point.dy
                };

                draw(calcPoint);
            });
        });
    };

    app.host.on("reon", function ()
    {
        console.log("Reconnect");
        handleItemsDraw(items);
    });

    items = app.host.get("/ItemList#items" + canvasId);
    // items = new ItemList('items');
    items.on("init", function ()
    {
        console.log("State revived");
        handleItemsDraw(items);
    });

    items.on(function (spec, val, source)
    {
        var item = items.getObject(val);
        console.log("Received item", spec.op(), item);

        console.log("Draw points", item.points.length);
        handleItemsDraw(items);
    });

    user.on("init", function ()
    {
        console.log("User state loaded", user);
        color = user.color;
    });

    reisizeHandler();
    handler();
}

/**
 * Change the canvas DOM size attributes
 */
function setCanvasSize (size)
{
    console.log("Resize the window", size);

    canvasEl.setAttribute("width", size.width);
    canvasEl.setAttribute("height", size.height);
}

/**
 * On window resize event handler
 */
function reisizeHandler ()
{
    var resize = Rx.Observable.fromEvent(window, 'resize')
        .map(function (e) {
            return {
                width: e.target.innerWidth,
                height: e.target.innerHeight,
            };
        });

    resize.subscribe(setCanvasSize);
}

function handler ()
{
    var eventsList = "panstart panleft panright panup pandown pan tap";

    var touch = Rx.Observable.create(function (observer) {
        hammer.on(eventsList, function (e) {

            e.color = color;
            // Yield a single value and complete
            observer.onNext(e);
            //observer.onCompleted();

            /*
             if (e.isFinal) {
             observer.onCompleted();
             }
             */
        });

        // Any cleanup logic might go here
        return function () {
            console.log('disposed');
        };
    });

    var subscription = touch
        .map(function (e) {
            // console.log(e);
            return {
                x: e.center.x,
                y: e.center.y,
                color: e.color
            };
        })
        .subscribe(draw);

    var openings = Rx.Observable.interval(500);

    var bufferedPoints = touch
        .buffer(openings)
        .map(function (array)
        {
            return array.map(function (point)
            {
                return {
                    x: point.center.x,
                    y: point.center.y
                };
            });
        });

    bufferedPoints.subscribe(function (points)
    {
        if (1 >= points.length)
        {
            console.log("Not enough points");
            return;
        }

        var itemData = {
            "startX": points[0].x,
            "startY": points[1].y
        };

        itemData.points = points.map(function (point) {

            return {
                "dx": itemData.startX - point.x,
                "dy": itemData.startY - point.y
            };
        });

        // Create the ink item
        var newItem = new Item();
        newItem.set(itemData);

        // Insert item to list
        items.insert(newItem);
    });
}

function debug (e)
{
    console.log("E", e);
}

function draw (point)
{
    context.fillStyle = '#' + point.color || 'FFF';
    context.beginPath();
    context.arc(point.x, point.y, 2.5, 0, Math.PI * 2, true );
    context.closePath();
    context.fill();
}

main();
