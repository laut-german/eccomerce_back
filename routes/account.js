const express = require('express');
const router = express.Router();
const config = require('../settings/config');
const jwt = require('jsonwebtoken');
const checkJWT = require('../middelwares/check.jwt');
const User = require('../models/user');

router.post('/signin', (req, res, next) => {

	let user = new User();
	user.name = req.body.name || '';
	user.email = req.body.email || '';
	user.password = req.body.password || '';
	user.picture = user.gravatar();
	user.isSeller = req.body.isSeller || false;
	User.findOne({ email: req.body.email }, (err, rowUser) => {
		if (err) return next(err);
		if (rowUser) {
			res.status(200).json({
				success: false,
				message: "Account with that  email is already exists"
			})
		} else {
			user.save();
			let token = jwt.sign({
				user: user
			}, config.secret, {
				expiresIn: '7d'
			});

			return res.json({
				success: true,
				message: 'SigIn succesfully',
				token: token
			});
		}

	});

});

router.post('/login', (req, res, next) => {

	User.findOne({ email: req.body.email }, (err, rowUser) => {
		if (err) return next(err);
		if (!rowUser) {
			return res.status(200).json({
				success: false,
				message: "Authentication failed, user not found"
			});
		} else {
			let isCorrectPassword = rowUser.comparePassword(req.body.password);
			if (!isCorrectPassword) {
				return res.json({
					success: false,
					message: "Authentication failed, wrong password"
				});
			} else {
				let token = jwt.sign({ user: rowUser }, config.secret, { expiresIn: '7d' });
				return res.json({
					success: true,
					message: "logIn Successfully",
					token: token
				})
			}
		}
	});
});

router.route('/profile')
	.get(checkJWT, (req, res, next) => {
		User.findOne({ _id: req.decoded.user._id }, (err, user) => {
			if (err) next(err);
			return res.json({
				success: true,
				user: user,
				message: 'Succesful'
			})
		})

	})
	.post(checkJWT, (req, res, next) => {
		User.findOne({ _id: req.decoded.user._id }, (err, user) => {
			if (err) return next(err);
			if (req.body.name) user.name = req.body.name;
			if (req.body.password) user.password = req.body.password;
			if (req.body.email) user.password = req.body.password;
			user.isSeller = req.body.isSeller;
			console.log('req.body.isSeller ->'+req.body.isSeller);
			console.log('user.isSeller ->'+user.isSeller);
			user.save();
			return res.json({
				success: true,
				message: 'Succesfully edited your profile!'
			});
		});
	});

router.route('/address')
	.get(checkJWT, (req, res, next) => {

		User.findOne({ _id: req.decoded.user._id }, (err, user) => {
			if (err) return next(err);
			return res.json({
				success: true,
				message: 'Successful',
				address: user.address
			})
		});
	})
	.post(checkJWT, (req, res, next) => {
		User.findOne({ _id: req.decoded.user._id }, (err, user) => {
			if (err) return next(err);
			if (req.body.addr1) user.address.addr1 = req.body.addr1;
			if (req.body.addr2) user.address.addr2 = req.body.addr2;
			if (req.body.city) user.address.city = req.body.city;
			if (req.body.state) user.address.state = req.body.state;
			if (req.body.country) user.address.country = req.body.country;
			if (req.body.postalcode) user.address.postalcode = req.body.postalcode;
			user.save();
			return res.json({
				success: true,
				message: 'Successfully edited address'
			})


		});

	});
module.exports = router;
