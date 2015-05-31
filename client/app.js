
var Rx       = require("rx");
var raf      = require("raf");
var simplify = require("simplify-geometry");

var SwarmApp     = require("./SwarmApp");
var InputHandler = require("./InputHandler");
var User         = require("../model/User");
var UserList     = require("../model/UserList");
var Item         = require("../model/Item");
var ItemList     = require("../model/ItemList");

// Refactor into separate class
var canvasEl = document.getElementById("kanvas");
var statusEl = document.querySelector(".status");

var SIMPLIFY_CONFICENT = 0.3;

var wsServer = "ws://" + window.location.host;
var canvasId = location.hash.replace("#", "") || "global";
var drawBuffer = [];
var input;
var color;
var context;
var app;
var user;
var users;
var items;

function main ()
{
    var size = getWindowSize();

    // Swarm setup
    app = new SwarmApp();
    app.init(wsServer);
    app.addListeners();

    input = new InputHandler(canvasEl);

    setCanvasSize(size);

    context = canvasEl.getContext("2d");

    applicationHandler();
    usersHandler();
    itemsHandler();

    onDraw();
    onLoadHandler();
    reisizeHandler();
    handler();
}

function handleItemsDraw (items)
{
    // Draw all items
    items.forEach(function (item)
    {
        var x = item.startX || 0;
        var y = item.startY || 0;

        item.points.forEach(function (point)
        {
            var calcPoint = {
                x: x - point[0],
                y: y - point[1],
                color: item.color
            };

            drawBuffer.push(calcPoint);
        });
    });
}

/**
 * Application level event handler.
 */
function applicationHandler ()
{
    // Application level events
    app.host.on("reon", function ()
    {
        console.log("Reconnect");
        statusEl.textContent = "Online " + app.host.isUplinked();

        handleItemsDraw(items);
    });

    app.host.on("off", function (spec, val)
    {
        statusEl.textContent = "Offline " + app.host.isUplinked();
    });

    app.host.on("reoff", function (spec, val)
    {
        statusEl.textContent = "Offline " + app.host.isUplinked();
    });
}

/**
 * User level event handling.
 */
function usersHandler ()
{
    // Data structure specific events
    user = new User(app.getAppId());
    user.once("init", function ()
    {
        user.set({ "name": user.generateRandomName() });

        document.title = "Connected - " + app.getAppId();
        color = user.color;
    });

    users = app.host.get("/UserList#users" + canvasId);
    users.addObject(user);
}

function itemsHandler ()
{
    // Get the items list reference to this canvas
    items = app.host.get("/ItemList#items" + canvasId);
    items.on(".on", function (spec, val, source) {

       console.log("Item", spec);
       var newItem = items.getObject(val);

       handleItemsDraw([ newItem ]);
    });

    // Triggers only on the first time when object is ready
    items.onObjectStateReady(function ()
    {
        if (this._version !== "!0") {
            return;
        }

        console.log("State revived");
        handleItemsDraw(items);
    });

    // Triggers only locally, not on the remote
    items.onObjectEvent(function (spec, val, source)
    {
        console.log("Ready", spec);
        handleItemsDraw([ source ]);
    });
}

/**
 * Get window size
 *
 * @returns {{width: Number, height: Number}}
 */
function getWindowSize ()
{
    return {
        width: window.innerWidth,
        height: window.innerHeight
    };
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
        .map(function (e)
        {
            return {
                width: e.target.innerWidth,
                height: e.target.innerHeight
            };
        });

    resize.subscribe(setCanvasSize);
}

function onDraw()
{
    var draw = function ()
    {
        // Animation logic here
        var partBuffer = drawBuffer.splice(0, 80);

        partBuffer.map(drawPoint);

        raf(draw);
    };

    // Start drawing using the requestanimationframe
    raf(draw);
}

function onLoadHandler ()
{
    var handler = function ()
    {
        console.log("Before unload remove user");
        users.removeObject(user);

        app.host.close();
    };

    window.addEventListener("onbeforeunload", handler, false);
}

function handler ()
{
    var touch = input.getStream();

    // Draw
    touch.subscribe(drawPoint);

    // For syncing use time buffered stream
    var openings = Rx.Observable.interval(2500);
    var bufferedPoints = touch
        .buffer(openings)
        .map(function (array)
        {
            return array.map(function (point)
            {
                return [
                    point.x,
                    point.y
                ];
            });
        });

    bufferedPoints.subscribe(function (points)
    {
        if (1 >= points.length)
        {
            console.log("Not enough points");
            return;
        }

        var first = points.shift();

        var itemData = {
            "startX": first[0],
            "startY": first[1],
            "color": color
        };

        // Simplify the points array
        itemData.points = simplify(points.map(function (point) {

            return [
                itemData.startX - point[0],
                itemData.startY - point[1]
            ];

        }), SIMPLIFY_CONFICENT);

        // Create the ink item
        var newItem = new Item(itemData);

        // Insert item to list
        items.insert(newItem);
    });
}

function debug (e)
{
    console.log("Event", e);
}

function drawPoint (point)
{
    context.fillStyle = '#' + point.color || color || 'FFF';
    context.beginPath();
    context.arc(point.x, point.y, 2.5, 0, Math.PI * 2, true );
    context.closePath();
    context.fill();
}

function drawRect (rect)
{
    context.rect(rect.x, rect.y, rect.width, rect.height);
    context.stroke();
}

main();
