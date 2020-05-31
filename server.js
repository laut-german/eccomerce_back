const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const config = require('./settings/config');
const allowHeaders = require('./middelwares/allowHeaders');
const setdb = require('./settings/setdb');
const app = express();
app.use(bodyParser.json({limit: '10mb', extended: true}));
app.use(bodyParser.urlencoded({limit: '10mb', extended: true})); 
app.use(morgan('dev'));
setdb.initDb();


app.use(allowHeaders);
let accountRouter = require('./routes/account');
let homeRouter = require('./routes/home');
let vendorRouter = require('./routes/vendor');
let producSearchRouter = require('./routes/product.search');
app.use('/accounts',accountRouter);
app.use('/home',homeRouter);
app.use('/vendor',vendorRouter);
app.use('/search',producSearchRouter);
app.listen(config.port,err=>{
	console.log("Server manually is running on port 3030");
	
});
