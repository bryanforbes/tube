define(function (require) {
	var has = require('./has'),
		Evented = require('dojo/Evented'),
		BrowserWebSocket = (function () {
			return this[has('websocket')];
		})();

	function WebSocket(url, options) {
		var hub = new Evented(),
			state = WebSocket.CLOSED,
			socket;

		this.get = function (name) {
			if (name === 'state') {
				return state;
			}
			else if (name === 'url') {
				return url;
			}
		};

		this.open = function () {
			function handleClose(event) {
				state = WebSocket.CLOSED;
				hub.emit('close', event);
				socket = null;
			}

			if (socket) {
				return;
			}

			state = WebSocket.CONNECTING;
			socket = new BrowserWebSocket(url);
			socket.onerror = handleClose;

			socket.onopen = function (event) {
				state = WebSocket.OPEN;
				hub.emit('open', event);

				this.onmessage = function (event) {
					hub.emit('message', event.data);
				};

				this.onerror = function (event) {
					hub.emit('error', event);
					handleClose();
				};

				this.onclose = handleClose;
			};
		};

		this.close = function () {
			state = WebSocket.CLOSING;
			socket && socket.close.apply(socket, arguments);
		};

		this.on = function () {
			return hub.on.apply(hub, arguments);
		};

		this.emit = function (message) {
			if (!socket || state !== WebSocket.OPEN) {
				return;
			}

			socket.send(message);
		};
	}

	WebSocket.CONNECTING = 0;
	WebSocket.OPEN = 1;
	WebSocket.CLOSING = 2;
	WebSocket.CLOSED = 3;

	return WebSocket;
});
