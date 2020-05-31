const express = require('express');
const router = express.Router();
const Category = require('../models/category');
const Product = require('../models/product');
const Review = require('../models/review');
const async = require('async');
const checkJWT = require('../middelwares/check.jwt');
const stripe = require('stripe')('sk_test_RPABKc8Xzvxogy8w59sdGtY000OM6SBDDP');
const Order = require('../models/order');
router.route('/category')
	.get((req, res, next) => {
		Category.find({}, (err, categories) => {
			if (err) next(err);
			return res.json({
				success: true,
				categories: categories
			})
		})
	})
	.post((req, res, next) => {
		let category = new Category();
		category.name = req.body.name || '';
		try {
			category.save();
			res.json({
				success: true,
				message: 'Succesful'
			});
		} catch (error) {
			next(error);
		}

	});

router.get('/category/test/:id', (req, res, next) => {
	const perPage = 10;
	Product.find({ category: req.params.id })
		.populate('category')
		.exec((err, products) => {
			if (err) return next(err);
			Product.countDocuments({ category: req.params.id }, (err, totalProducts) => {
				if (err) return next(err);
				res.json({
					success: true,
					products: products,
					message: 'category',
					categoryName: products[0].category.name,
					totalProducts: totalProducts,
					pages: Math.ceil(totalProducts / perPage)
				})
			});
		})
});

router.get('/category/:id', (req, res, next) => {
	const page = req.query.page;
	console.log(page);
	const perPage = 10;
	async.waterfall([
		function (callback) {
			Product.count({ category: req.params.id }, (err, count) => {
				var totalProducts = count;
				callback(err, totalProducts);
			})
		},
		function (totalProducts, callback) {
			Product.find({ category: req.params.id })
				.skip(perPage * page)
				.limit(perPage)
				.populate('category')
				.populate('owner')
				.exec((err, products) => {
					//if(err) return next(err)
					callback(err, products, totalProducts)
				})
		},
		function (products, totalProducts, callback) {
			Category.findOne({ _id: req.params.id }, (err, category) => {
				res.json({
					success: true,
					message: 'category',
					products: products,
					totalProducts: totalProducts,
					categoryName: category.name,
					pages: Math.ceil(totalProducts / perPage)
				})
			})
		}
	])
})
//Same below function but using parallell

router.get('/categoryparallel/:id', (req, res, next) => {
	const page = req.query.page;
	const perPage = 10;
	async.parallel([
		function (callback) {
			Product.count({ category: req.params.id }, (err, count) => {
				var totalProducts = count;
				callback(err, totalProducts);
			})
		},
		function (callback) {
			Product.find({ category: req.params.id })
				.skip(perPage * page)
				.limit(perPage)
				.populate('category')
				.populate('owner')
				.populate('review')
				.exec((err, products) => {
					if (err) return next(err)
					callback(err, products)
				})
		},
		function (callback) {
			Category.findOne({ _id: req.params.id }, (err, category) => {
				callback(category);
			})
		}
	], function (err, results) {
		if (err) return next(err);
		var totalProducts = results[0];
		var products = results[1];
		var category = results[2];
		return res.json({
			success: true,
			message: 'category',
			products: products,
			totalProducts: totalProducts,
			categoryName: category.name,
			pages: Math.ceil(totalProducts / perPage)
		})

	});
})

router.get('/products/:id', (req, res) => {
	Product.findById({ _id: req.params.id })
		.populate('owner')
		.populate('category')
		.deepPopulate('reviews.owner')
		.exec((err, product) => {
			if (err) {
				return res.json({
					success: false,
					message: 'Product not found'
				})
			} else {
				return res.json({
					success: true,
					product: product
				})
			}
		})
})

router.get('/products', (req, res) => {
	var page = req.query.page;
	var perPage = 10;
	async.parallel(
		[function (callback) {
			Product.count({}, (err, totalProducts) => {
				callback(totalProducts);
			})
		}, function (callback) {
			Product.find({})
				.populate('category')
				.populate('owner')
				.deepPopulate('review.owner')
				.skip(perPage * page)
				.limit(perPage)
				.exec((err, products) => {
					callback(products)
				})
		}], function (err, results) {
			var totalProducts = results[0];
			var products = results[1];
			res.json({
				success: true,
				totalProduct: totalProducts,
				products: products,
				pages: Math.ceil(totalProducts / perPage)
			})
		}
	)
});

router.post('/review', checkJWT, (req, res, next) => {
	async.waterfall([
		function (callback) {
			Product.findById({ _id: req.body.productId }, (err, product) => {
				if (product) {
					callback(err, product);
				}
			});
		},
		function (product, callback) {
			//if(err) return next(err);
			let review = new Review();
			review.owner = req.decoded.user._id;
			if (req.body.title) review.title = req.body.title;
			if (req.body.description) review.description = req.body.description;
			review.rating = req.body.rating;
			product.reviews.push(review._id);
			product.save();
			review.save();
			return res.json({
				success: true,
				message: 'Succesfully added the review'
			});
		}
	])
});

router.post('/payment',(req,res,next)=>{
	let stripeToken = req.body.stripeToken;
	let currentCharges = Math.round(req.body.totalPrice*100);
	stripe
	.customer
	.create({
		source:stripeToken.id
	}).then(
		function(customer){
			return stripe.charges.create({
				amount:currentChargues,
				currency:'usd',
				customer:customer.id
			})
		}
	).then(function(charge){
		let products = req.body.products;
		let order = new Order();
		order.owner = req.body.decoded.user._id;
		order.totalPrice = currentCharges;

		products.map((product)=>{
			order.products.push({
				product:product.Product,
				quantity:product.quantity
			})
		});

		order.save();
		return res.json({
			success:true,
			message:'Succesfully made a payment'
		})
	})
})
module.exports = router;
