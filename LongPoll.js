define(function () {
	var Evented = require('dojo/Evented'),
		array = require('dojo/_base/array'),
		request = require('dojo/request');

	function LongPoll(url, options) {
		var hub = new Evented(),
			state = LongPoll.CLOSED,
			self = this,
			connections = [],
			timeout;

		function poll() {
			if (!connections.length) {
				send().then(function (data) {
					if (data) {
						hub.emit('message', data);
					}
				});
			}
		}
		function send(args) {
			var promise = self.transport(url, args);

			clearTimeout(timeout);
			connections.push(promise);

			return promise.always(function () {
				connections.splice(array.indexOf(connections, promise), 1);
			}).then(
				function () {
					state = LongPoll.OPEN;

					if (!connections.length) {
						timeout = setTimeout(poll, options.delay);
					}
				},
				function (error) {
					if (state !== LongPoll.CLOSING) {
						hub.emit('error', error);

						if (!connections.length) {
							state = LongPoll.CLOSED;
							hub.emit('close', error);
						}
					}
				}
			);
		}

		options = options || {};

		this.transport = options.transport || request;

		this.get = function (name) {
			if (name === 'state') {
				return state;
			}
			else if (name === 'url') {
				return url;
			}
		};

		this.open = function () {
			if (state !== LongPoll.CLOSED) {
				return;
			}

			state = LongPoll.CONNECTING;

			try {
				send({
					headers: { Pragma: 'start-long-poll' }
				}).then(function (data) {
					hub.emit('open', {});
					if (data) {
						hub.emit('message', data);
					}
				});
			}
			catch (e) {}
		};

		this.close = function () {
			if (state === LongPoll.CLOSED) {
				return;
			}

			state = LongPoll.CLOSING;

			clearTimeout(timeout);
			while (connections.length) {
				// TODO: make sure this will work
				connections[0].cancel();
			}

			state = LongPoll.CLOSED;
			hub.emit('close', {});
		};

		this.on = function () {
			return hub.on.apply(hub, arguments);
		};

		this.send = function (message) {
			if (state === LongPoll.CLOSED) {
				return;
			}

			send({ data: message }).then(function (data) {
				if (data) {
					hub.emit('message', data);
				}
			});
		};
	}

	LongPoll.CONNECTING = 0;
	LongPoll.OPEN = 1;
	LongPoll.CLOSING = 2;
	LongPoll.CLOSED = 3;

	return LongPoll;
});
