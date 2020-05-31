const jwt = require('jsonwebtoken');
const config = require('../settings/config');

module.exports = function(req,res,next){
	let token = req.headers['authorization'];
	if(token){
		jwt.verify(token,config.secret,function(err,decoded){
			if(err){
				res.json({
					success:false,
					message:'Failed to authenticate token'
				})
			}
			req.decoded = decoded;
			next();
		});
	}else{
		res.json({
			success:false,
			message:'No token provided'
		})
	}
}
