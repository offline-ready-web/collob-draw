
# Swarm - drawing application

## Requirements

To run the program make sure you have installed following programs:

 - Redis v2.8.x - the server side operations storage
 - Node.js v0.12.x or io.js latest versions - to run the server
 - NPM v2.5.x - package manager

## Installation

Make sure you have read the requirements section before.

```npm install```

## Modules list

 - [FontAwesome](http://fontawesome.io/) - icons

 - [RxJS](http://reactivex.io/) - An API for asynchronous programming
with observable streams

## Development

The client side code needs to be ```browserified``` before running, to do that run
the following commands.

To watch the client side file changes in background use:

```npm run-script watch &```

One time build is available with:

```npm run-script build```

Start the server with the command:

```node server.js```

## License

MIT
