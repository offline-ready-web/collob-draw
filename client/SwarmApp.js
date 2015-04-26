
var Swarm    = require('swarm');

var SwarmApp = function ()
{
    this.env = Swarm.env;
    this.env.debug = true;
};

SwarmApp.prototype.init = function (hostUrl)
{
    var hash = window.location.hash || '#0';

    // Setup APP id
    this.id = this.getAppId();
    this.setAppId(this.id);

    // Local replica storage
    this.storage = new Swarm.SharedWebStorage("cache");

    // Setup the connecting host
    this.host = new Swarm.Host(this.id, 0, this.storage);
    this.host.connect(hostUrl);
};

SwarmApp.prototype.addListeners = function ()
{
    this.host.on("reon", this.hostHandler);
    this.host.on("reoff", this.hostHandler);
    this.host.on("off", this.hostHandler);
};

SwarmApp.prototype.hostHandler = function (spec, val)
{
    console.log("Host handler called ", spec, val);
};

SwarmApp.prototype.getAppId = function ()
{
    return window.localStorage.getItem("localuser") ||
        "A" + Swarm.Spec.int2base(~~(Math.random() * 10000));
};

SwarmApp.prototype.setAppId = function (id)
{
    window.localStorage.setItem("localuser", id);
    return id;
};

module.exports = SwarmApp;
