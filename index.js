'use strict';
const querystring = require('querystring');
const WebSocket = require('ws');
const EventEmitter = require('events');

class MirkoczatClient {
	constructor(uri='', params={}) {
		this.tag = params.tag;
		this.token = params.token;
		this.connectUrl = encodeURI(`${uri}?${querystring.stringify(params)}`);

		this.ref = 1;

		this.room = {};
		this.global = {};
	}

	connect(callback) {
		let ws = this.ws = new WebSocket(this.connectUrl);
		let me = this.myEmitter = new EventEmitter();

		ws.on('error', (error) => {
			me.emit('error', error);
		});

		ws.on('close', (code, message) => {
			me.emit('close', code, message);
		});

		ws.on('message', (data, flags) => {
			let message = JSON.parse(data);
			let {topic, ref, event, payload} = message;

			me.emit('all', message);

			switch(event) {
				case 'phx_join':
					me.emit('phx_join', payload);
					break;
				case 'phx_reply':
					me.emit('phx_reply', payload);
					break;
				case 'join':
					callback(); // !!!!
					me.emit('join', payload);
					break;
				case 'msg:send':
					me.emit('message', payload);
					break;
				case 'msg:priv':
					me.emit('priv', payload);
					break;
				case 'info:cmd':
					me.emit('info', payload);
					break;
				case 'info:enter':
					me.emit('enter', payload);
					break;
				case 'info:leave':
					me.emit('leave', payload);
					break;
				case 'info:room':
					this.room = payload;
					me.emit('room');
					break;
				case 'info:global':
					this.global = payload;
					me.emit('global');
					break;
				case 'info:user':
					me.emit('user', payload);
					break;
				case 'heartbeat':
					ws.send(JSON.stringify({
						topic: "phoenix",
						event: "heartbeat",
						payload: {},
						ref: this.ref++
					}));
					break;
				case 'msg:plus':
					me.emit('plus', payload);
					break;
				default:
			}
		});

		ws.on('ping', (data, flags) => {
			me.emit('ping', data, flags);
		});

		ws.on('pong', (data, flags) => {
			me.emit('pong', data, flags);
		});

		ws.on('open', () => {
			ws.send(JSON.stringify({
				topic: `rooms:${this.tag}`,
				event: "phx_join",
				payload: {},
				ref: this.ref++
			}));
		});
	}

	on(action, callback) {
		return this.myEmitter.on(action, callback);
	}

	send(message='') {
		let ws = this.ws;
		let msg = JSON.stringify({
			topic: `rooms:${this.tag}`,
			ref: this.ref++,
			payload: {
				body: message
			},
			event: 'msg:send'
		});
		ws.send(msg);
	}
}

module.exports = MirkoczatClient;