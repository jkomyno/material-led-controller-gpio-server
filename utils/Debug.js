/* easy debug enable/disable toggle
 * default: toggleDebug(false)
 */
module.exports = function toggleDebug(bool){
					bool = bool || false;
					var consoleHolder = console;
					if(!bool){
						consoleHolder = console;
						console = {};
						console.log = function(){};
						console.error = function(){}
					} else console = consoleHolder
				}