const express = require('express');
const router = express.Router({mergeParams: true});
const asyncMiddleware = require('../../utils/asyncMiddleware');
const Questionnaire = require('../../models/questionnaire');

/* GET questions for a user. */
router.get('/', asyncMiddleware(async function(req, res, next) {
	let questionnaire = await Questionnaire.findOne({_id: req.params.id}, {users: 1});
	res.send(questionnaire.users);
}));

router.post('/', asyncMiddleware(async function(req, res, next) {
	let questionnaire = await Questionnaire.findOne({_id: req.params.id}, {users: 1});
	let response = await questionnaire.addUser(req.body);
	res.send(response.toPOJO());
}));

router.put('/:userId', asyncMiddleware(async function(req,res,next) {
	let questionnaire = await Questionnaire.findOne({_id: req.params.id}, {users: 1});
	let response = await questionnaire.updateUser(req.params.userId, req.body);
	res.send(response.toPOJO());
}));

router.delete('/:userId', asyncMiddleware(async function(req,res,next) {
	let questionnaire = await Questionnaire.findOne({_id: req.params.id}, {users: 1});
	let response = await questionnaire.deleteUser(req.params.userId);
	res.send(response.toPOJO());
}));
module.exports = router;