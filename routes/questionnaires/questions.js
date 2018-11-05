const express = require('express');
const router = express.Router({mergeParams: true});
const asyncMiddleware = require('../../utils/asyncMiddleware');
const Questionnaire = require('../../models/questionnaire');

/* GET questions for a user. */
router.get('/', asyncMiddleware(async function(req, res, next) {
	let questionnaire = await Questionnaire.findOne({_id: req.params.id}, {questions: 1});
	res.send(questionnaire.questions);
}));

router.post('/', asyncMiddleware(async function(req, res, next) {
	let questionnaire = await Questionnaire.findOne({_id: req.params.id}, {questions: 1});
	let response = await questionnaire.addQuestion(req.body);
	res.send(response.toPOJO());
}));

router.get('/:index', asyncMiddleware(async function(req, res, next) {
	let questionnaire = await Questionnaire.findOne({_id: req.params.id}, {questions: 1});
	res.send(questionnaire.questions.splice( req.params.index, 1));
}));

router.put('/:index', asyncMiddleware(async function(req,res,next) {
	let questionnaire = await Questionnaire.findOne({_id: req.params.id}, {questions: 1});
	let response = await questionnaire.updateQuestion(req.params.index, req.body);
	res.send(response.toPOJO());
}));

router.delete('/:index', asyncMiddleware(async function(req,res,next) {
	let questionnaire = await Questionnaire.findOne({_id: req.params.id}, {questions: 1});
	let response = await questionnaire.deleteQuestion(req.params.index);
	res.send(response.toPOJO());
}));

module.exports = router;