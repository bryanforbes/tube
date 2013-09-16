define(function (require, exports) {
	var has = require('./has'),
		defaultProvider;

	exports.load = function (id, parentRequire, load) {
		var providerId;
		if (id && id.toLowerCase() === 'websocket') {
			providerId = './WebSocket';
		}
		else if (id && id.toLowerCase() === 'longpoll') {
			providerId = './LongPoll';
		}
		else {
			if (!defaultProvider) {
				defaultProvider = has('websocket') ? './WebSocket' : './LongPoll';
			}
			providerId = defaultProvider;
		}

		require([providerId], load);
	};
});
