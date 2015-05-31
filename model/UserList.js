
var SyncSet = require("swarm").Set;
var User = require("./User");

module.exports = SyncSet.extend("UserList", {
    objectType: User
});
