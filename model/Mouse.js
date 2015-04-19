var Swarm = require('swarm');

var Mouse = Swarm.Model.extend('Mouse', {
    defaults: {
        name: 'Mickey',
        x: 0,
        y: 0
    }
});

module.exports = Mouse; // CommonJS
