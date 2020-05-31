const router = require('express').Router();
const multer = require('multer');
const multers3 = require('multer-s3');
const aws = require('aws-sdk');
const faker = require('faker');
const async = require('async');
const checkJWT = require('../middelwares/check.jwt');
const Product = require('../models/product');
const s3 = new aws.S3({ accessKeyId: 'AKIAQWGRZGL3FVGNADHI', secretAccessKey: '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' })


const upload = multer({
	storage: multers3({
		s3: s3,
		bucket: 'eccomercewebapp',
		metadata: function (req, file, cb) {
			cb(null, { fieldName: file.fieldname });
		},
		key: function (req, file, cb) {
			cb(null, Date.now.toString());
		}
	})
});

router.route('/product')
	.get(checkJWT, (req, res, next) => {
		Product.find({ owner: req.decoded.user._id })
			.populate('owner')
			.populate('category')
			.exec((err, products) => {
				if (products) {
					return res.json({
						success: true,
						message: 'Products',
						products: products
					})
				}
			});
	})
	.post([checkJWT, upload.single('product_picture')], (req, res, next) => {
		let product = new Product();
		product.owner = req.decoded.user._id;
		product.category = req.body.categoryId || '';
		product.title = req.body.title || '';
		product.description = req.body.description || '';
		product.price = req.body.price || '';
		product.image = req.file.location;
		product.save();
		return res.json({
			success: true,
			message: 'Succesfully Added the product'
		})
	});
/* Just for test */
router.get('/faker/test', (req, res) => {

	
	let array = new Array(20);
	array.fill(0);
	async.each(array,function(item,next){
		let product = new Product();
		product.owner = '5ea6f402669f574988cd3264';
		product.category = '5ea6f9de669f574988cd3266';
		product.title = faker.commerce.productName();
		product.price = faker.commerce.price();
		product.image = faker.image.sports();
		product.description = faker.lorem.words();
		product.save(function(err,product){
			if(err) return next(err);
			next();
		})
	},function(err){
		if(err){
			return res.status(500).json(err)
		}else{
			return res.json({
				message:'20 products created succesfuly'
			})
		}
	})




});
module.exports = router;
