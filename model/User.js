
var Swarm = require('swarm');

var User = Swarm.Model.extend('User', {

    defaults: {
        name: 'No-name',
        color: (~~(Math.random() * (1<<24))).toString(16),
    },

    setRandomName: function () {

        this.set({ name: this.generateRandomName() });
    },

    generateRandomName: function () {

        var base = [ 'mikk', 'chuck', 'john', 'mile' ];

        return base[Math.floor(Math.random() * base.length)] +
            Math.floor(Math.random() * 9999);
    }
});

module.exports = User;
