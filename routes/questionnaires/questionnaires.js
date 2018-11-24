const express = require('express');
const router = express.Router({mergeParams: true});
const Questionnaire = require('../../models/questionnaire');
const asyncMiddleware = require('../../utils/asyncMiddleware');
/* GET questionnaires for a user. */
router.get('/', asyncMiddleware(async function (req, res, next) {
	let questionnaires = await Questionnaire.find();
	res.send(questionnaires.toPOJO());
}));

router.get('/:id', asyncMiddleware(async function (req, res, next) {
	let questionnaire = await Questionnaire.findOne({_id: req.params.id});
	res.send(questionnaire.toPOJO());
}));

router.post('/', asyncMiddleware(async function (req, res, next) {
	let questionnaire = await Questionnaire.create(req.body);
	res.send(questionnaire.toPOJO());
}));

router.put('/:id', asyncMiddleware(async function (req, res, next) {
	let questionnaire = await Questionnaire.findOne({_id: req.params.id});
	questionnaire = await questionnaire.assign(req.body);
	res.send(questionnaire.toPOJO());
}));

router.post('/:id/start', asyncMiddleware(async function(req, res, next){
	let questionnaire = await Questionnaire.findOne({_id: req.params.id});

}));

module.exports = router;
