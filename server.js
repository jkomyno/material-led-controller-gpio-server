// import npm modules
var express = require('express');
var socketio = require('socket.io');
// import debug configuration
var toggleDebug = require('./utils/Debug');
var toggleRPi = require('./utils/RPi');
toggleDebug(true);
var wpi = toggleRPi(true);
// express/socket.io stuff
var app = express();
var port = 3000;
var server = app.listen(port);
var io = socketio.listen(server);

// rpi related
var pins = [7, 0];
console.log("pins " + pins + " setup");
wpi.setup('wpi');

// bad practice, I know
var globalObj = { intervalValue: 1000 };

for(var pin of pins){
	console.log(pin, " in OUTPUT");
	wpi.pinMode(pin, wpi.OUTPUT);
}

function controlSinglePin(pin, status){
	console.log("SINGLEPIN -> " + pin + ": " + status ? 1 : 0);
	wpi.digitalWrite(pin, status ? 1 : 0)
}

function controlEveryPin(status, stop){
	stop = stop || false;
	console.log("Stop blink: " + stop);
	if(!stop){
		for(var pin of pins){
			console.log("EVERYPIN -> " + pin + ": " + status ? 1 : 0);
			wpi.digitalWrite(pin, status ? 1 : 0);
		}
	} else {
		cleanUp(pins);
	}
}

/* DOESN'T WORK
 *
 * @param interval: the timeOut to pass to setInterval()
 * @param pins: array of pins used to blink the correct leds
 * @param breakInterval: facultative argument that allows to break the function
 */
function controlBothPinsAlternately(interval, pins, breakInterval){
	//breakInterval = breakInterval || false;
	console.log("alt");
	console.log("BOTHALT: interval -> " + interval);
	console.log("BOTHALT: breakInterval -> " + interval);
	var isLedOn = 0;
	var setIntervalID = setInterval(function(){
		if(breakInterval){
			clearInterval(setIntervalID);
			console.log("Interval stopped");
			return;
		} else {
			isLedOn = +!isLedOn;
			wpi.digitalWrite(pins[0], isLedOn);
			console.log(pins[0] + " is " + isLedOn);
			wpi.digitalWrite(pins[1], isLedOn==0 ? 1 : 0);
			console.log(pins[1] + " is " + (isLedOn==0 ? 1 : 0));
		}
}, interval);
}

/* There is no "pass by reference" available in JavaScript. 
 * However, you can pass an object as argument and then have 
 * a function modify the object contents
 */
function alterInterval(interval){
	globalObj.interval = interval;
}

// Main socket.io handling
io.sockets.on('connection', function(socket){
	
	socket.on('ledControlSent', function(payload){
		console.log(payload);
		
		var led = payload.led;
		var status = payload.status;

		switch(led) {
		    case "led1":
		        controlSinglePin(pins[0], status);
		        break;
		    case "led2":
		        controlSinglePin(pins[1], status);
		        break;
		    case "both":
		    	controlEveryPin(status);
		    	break;
		    case "stop":
		    	controlEveryPin(status, true);
		    	break;
		}

		io.emit('ledControlArrived');
	});

	socket.on('setInterval', function(payload){

		console.log(payload);

		var led = payload.led;
		var intervalValue = payload.interval;
		var isLedOn = 0;
		var interval = setInterval(function(){
			isLedOn = +!isLedOn;
			wpi.digitalWrite(pins[0], isLedOn);
			console.log(pins[0] + " is " + isLedOn);
			wpi.digitalWrite(pins[1], isLedOn==0 ? 1 : 0);
			console.log(pins[1] + " is " + (isLedOn==0 ? 1 : 0));
		}, intervalValue, false);

		io.emit('setIntervalArrived');

		socket.on('clearInterval', function(){
			console.log('clearInterval was called');
			clearInterval(interval);
		});
	});

});

console.log('Server is running on port ' + port);

// onExit stuff to reset the state of the pins
function cleanUp(pins){
	for(var pin of pins){
		wpi.pinMode(pin, wpi.INPUT);
	}
}

// so that the program won't close immediately
process.stdin.resume();

function exitHandler(opts, err){
  if(opts.cleanup) cleanUp(pins);
  if(opts.exit) process.exit();
}

// do something when the node app is closing
process.on('exit', exitHandler.bind(null, {cleanup: true}));
// catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, {exit: true}));