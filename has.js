define(function (require) {
	var has = require('dojo/has');
	
	has.add('websocket', has('host-browser') && function (global) {
		if (global.WebSocket) {
			return 'WebSocket';
		}
		if (global.MozWebSocket) {
			return 'MozWebSocket';
		}
		return false;
	});

	return has;
});
