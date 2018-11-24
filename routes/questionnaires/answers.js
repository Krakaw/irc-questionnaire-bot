var express = require('express');
const router = express.Router({mergeParams: true});
const asyncMiddleware = require('../../utils/asyncMiddleware');
const Questionnaire = require('../../models/questionnaire');
const Answer = require('../../models/answer');

/* GET ansers for a user. */
router.get('/', asyncMiddleware(async function(req, res, next) {
	let answers = await Answer.find({questionnaireId: req.params.id, ...req.params.query});
	res.send(answers.toPOJO());
}));

router.post('/', asyncMiddleware(async function(req, res, next) {
	let answer = await Answer.create({...req.body, questionnaireId: req.params.id});
	res.send(answer.toPOJO());
}));

// router.put('/:userId', asyncMiddleware(async function(req,res,next) {
// 	let questionnaire = await Questionnaire.findOne({_id: req.params.id}, {users: 1});
// 	let response = await questionnaire.updateUser(req.params.userId, req.body);
// 	res.send(response);
// }));
//
// router.delete('/:userId', asyncMiddleware(async function(req,res,next) {
// 	let questionnaire = await Questionnaire.findOne({_id: req.params.id}, {users: 1});
// 	let response = await questionnaire.deleteUser(req.params.userId);
// 	res.send(response);
// }));
module.exports = router;
