const router = require('express').Router();
const algoliasearch = require('algoliasearch');
const client = algoliasearch('8XVC0KZCA6','31c9f27b4720af57e88de0ec30880592');
const index = client.initIndex('eccomercev1');

router.get('/',(req,res,next)=>{
	index.search({
		query:req.query.query,
		page:req.query.page,

	},(err,content)=>{
		return res.json({
			success:true,
			message:'Here is your content',
			status:200,
			content:content,
			search_result:req.query.query
		});
	});
});




module.exports = router;
