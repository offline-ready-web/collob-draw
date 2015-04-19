
var Swarm = require('swarm');

var Message = Swarm.Model.extend('Message', {

    defaults: {
        text: ''
    },
});

module.exports = Message;
