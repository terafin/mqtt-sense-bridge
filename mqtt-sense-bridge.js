// Requirements
const mqtt = require('mqtt')
const _ = require('lodash')

const logging = require('homeautomation-js-lib/logging.js')
const health = require('homeautomation-js-lib/health.js')
const sense = require('unofficial-sense')

require('homeautomation-js-lib/mqtt_helpers.js')

// Config
const topic_prefix = process.env.TOPIC_PREFIX
const username = process.env.SENSE_USERNAME
const password = process.env.SENSE_PASSWORD

// Setup MQTT
const client = mqtt.setupClient(null, null)

if (_.isNil(topic_prefix)) {
	logging.warn('TOPIC_PREFIX not set, not starting')
	process.abort()
}

if (_.isNil(username)) {
	logging.warn('SENSE_USERNAME not set, not starting')
	process.abort()
}

if (_.isNil(password)) {
	logging.warn('SENSE_PASSWORD not set, not starting')
	process.abort()
}

var mqttOptions = {}

var shouldRetain = process.env.MQTT_RETAIN

if (_.isNil(shouldRetain)) {
	shouldRetain = false
}

if (!_.isNil(shouldRetain)) {
	mqttOptions['retain'] = shouldRetain
}

sense({
	email: username,
	password: password
}, (data) => {
	if ( _.isNil(data) ) { 
		return 
	}
	if ( _.isNil(data.data) ) { 
		return 
	}
	if ( _.isNil(data.data.payload) ) { 
		return 
	}

	logging.info('sense updated: ' + Object.keys(data.data.payload))
	if (client.connected) { 
		health.healthyEvent() 
	}

	if ( !_.isNil(data.data.payload.devices) ) {
		const frame = data.data.payload
		const devices = frame.devices

		client.smartPublish(topic_prefix + '/watts_total', frame.w.toString())

		devices.forEach(device => {
			const watts = device.w
			const id = device.id
			const name = device.name
            
			logging.debug('================')
			logging.debug('name: ' + name + '  id: ' + id + '   w: ' + watts) 

			client.smartPublish(topic_prefix + '/' + name, watts.toString())
		})
	}
	logging.debug(data) 
})
