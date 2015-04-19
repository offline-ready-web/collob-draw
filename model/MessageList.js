
var Swarm   = require('swarm');
var Message = require('./Message');

var MessageList = Swarm.Vector.extend('MessageList', {

    objectType: Message
});

module.exports = MessageList;
