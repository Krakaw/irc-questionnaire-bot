const express = require('express');
const router = express.Router({mergeParams: true});
const asyncMiddleware = require('../utils/asyncMiddleware');
const User = require('../models/user');

/* GET users listing. */
router.get('/', asyncMiddleware(async function (req, res, next) {
	let users = await User.find();
	res.send(users.toPOJO());
}));

router.post('/', asyncMiddleware(async function(req, res, next) {
	let user = await User.create(req.body);
	res.send(user.toPOJO());
}));

router.put('/:id', asyncMiddleware(async function(req, res, next) {
	let user = await User.findOne({_id: req.params.id});
	user = await user.assign(req.body);
	res.send(user.toPOJO());
}));

module.exports = router;
