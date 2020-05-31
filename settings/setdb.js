const config = require('./config');
const mongoose = require('mongoose');

module.exports = {
	initDb: function () {
		var conn = mongoose.connection;
		conn.on("error", (err) => console.log("Mongodb connection error: " + err));
		conn.once("open", () => console.log("Mongodb is connected"));
		mongoose.connect(config.database, { useNewUrlParser: true, useUnifiedTopology: true,useCreateIndex:true })
	}
}
