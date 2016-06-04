/* function to spare time, as it allows me to
 * toggle 'wiring-pi' references off quickly,
 * which comes handy when developing on a non-ARM
 * machine.
 */
module.exports = function toggleRPi(bool){
					bool = bool || false;
					var wpi;
					if(!bool){
						wpi = {};
						wpi.setup = function(){};
						wpi.pinMode = function(){};
						wpi.digitalWrite = function(){};
						return wpi
					} else {
						try{
							wpi = require('wiring-pi');
						} catch(e){
							wpi = null;
							console.log("DEBUG: " + e);
						}
						return wpi
					}
				}