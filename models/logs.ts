const mongoose = require('mongoose')

const Schema = new mongoose.Schema({
	data: {
		type: Object,
		required: true
	}
})

const ErrorLogs = mongoose.model('errorLogs', Schema)
module.exports = () => ErrorLogs
