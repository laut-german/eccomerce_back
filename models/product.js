const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const deepPopulate = require('mongoose-deep-populate')(mongoose);
const mongooseAlgolia = require('mongoose-algolia');
const ProductSchema = new Schema({
	category: { type: Schema.Types.ObjectId, ref: 'Category' },
	owner: { type: Schema.Types.ObjectId, ref: 'User' },
	reviews: [{ type: Schema.Types.ObjectId, ref: 'Review' }],
	image: String,
	title: String,
	description: String,
	price: Number,
	created: { type: Date, default: Date.now }
}, {
	toObject: { virtuals: true },
	toJSON: { virtuals: true }

});
ProductSchema
	.virtual('averageRating')
	.get(function () {
		var rating = 0;
		if (this.reviews) {
			if (this.reviews.length == 0) {
				rating = 0;
			} else {
				this.reviews.map((review) => {
					rating += review.rating;
				});
				var averageRating = rating / this.reviews.length;
				return averageRating;
			}
		}
	});
ProductSchema.plugin(deepPopulate);
ProductSchema.plugin(mongooseAlgolia, {
	appId: '8XVC0KZCA6',
	apiKey: '31c9f27b4720af57e88de0ec30880592',
	indexName: 'eccomercev1', //The name of the index in Algolia, you can also pass in a function
	selector: ':id title image reviews description price owner created averageRating', //You can decide which field that are getting synced to Algolia (same as selector in mongoose)
	populate: {
		path: 'owner reviews',
		select: 'name rating',
	},
	defaults: {
		author: 'unknown',
	},
	mappings: {
		title: function (value) {
			return `${value}`
		},
	},
	virtuals: {
		averageRating: function (doc) {
			var rating = 0;
			if (doc.reviews) {
				if (doc.reviews.length == 0) {
					rating = 0;
				} else {
					doc.reviews.map((review) => {
						rating += review.rating;
					});
					var averageRating = rating / doc.reviews.length;
					return averageRating;
				}
			}
		},
	},
	debug: true
});
let Model = mongoose.model('Product', ProductSchema);
Model.SyncToAlgolia();
Model.SetAlgoliaSettings({
	searchableAttributes: ['title']
})
module.exports = Model;
