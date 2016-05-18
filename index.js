'use strict';
const querystring = require('querystring');
const WebSocket = require('ws');
const EventEmitter = require('events');
debugger;

const Mirkoczat = function(uri='', params={}) {
	this.tag = params.tag;
	this.token = params.token;
	this.connectUrl = encodeURI(`${uri}?${querystring.stringify(params)}`);

	this.ref = 1;

	this.room = {};
	this.global = {};
};

Mirkoczat.prototype.connect = function(callback) {
	let ws = this.ws = new WebSocket(this.connectUrl);
	let me = this.myEmitter = new EventEmitter();

	ws.on('error', (error) => {
		me.emit('error', error);
		console.log(error);
	});

	ws.on('close', (code, message) => {
		me.emit('close', code, message);
		console.log('close')
	});

	ws.on('message', (data, flags) => {
		let message = JSON.parse(data);
		let {topic, ref, event, payload} = message;

		me.emit('all', message);

		switch(event) {
			case 'phx_join':
				me.emit('phx_join', payload);
				console.log('phx_join');
				break;
			case 'phx_reply':
				me.emit('phx_reply', payload);
				console.log('phx_reply');
				break;
			case 'join':
				callback(); // !!!!
				me.emit('join', payload);
				console.log('join');
				break;
			case 'msg:send':
				me.emit('message', payload);
				console.log('msg:send');
				break;
			case 'msg:priv':
				me.emit('priv', payload);
				console.log('msg:priv');
				break;
			case 'info:cmd':
				me.emit('info', payload);
				console.log('info:cmd');
				break;
			case 'info:enter':
				me.emit('enter', payload);
				console.log('info:enter');
				break;
			case 'info:leave':
				me.emit('leave', payload);
				console.log('info:leave');
				break;
			case 'info:room':
				this.room = payload;
				me.emit('room');
				console.log('info:room');
				break;
			case 'info:global':
				this.global = payload;
				me.emit('global');
				console.log('info:global');
				break;
			case 'info:user':
				me.emit('user', payload);
				console.log('info:user');
				break;
			case 'heartbeat':
				console.log('heartbeat');
				ws.send(JSON.stringify({
					topic: "phoenix",
					event: "heartbeat",
					payload: {},
					ref: this.ref++
				}));
				break;
			case 'msg:plus':
				me.emit('plus', payload);
				console.log('msg:plus');
				break;
			default:
				console.log('none ' + event);
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

Mirkoczat.prototype.on = function(action, callback) {
	return this.myEmitter.on(action, callback);
};

Mirkoczat.prototype.send = function(message='') {
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
};

module.exports = Mirkoczat;