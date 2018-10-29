var express = require('express');
var router = express.Router();
const Questionnaire = require('../models/questionnaire');
const asyncMiddleware = require('../utils/asyncMiddleware');
/* GET questionnaires for a user. */
router.get('/', asyncMiddleware(async function(req, res, next) {
	let questionnaires = await Questionnaire.find();
    res.send(questionnaires);
}));

router.get('/:id', asyncMiddleware(async function(req, res, next) {
	let questionnaire = await Questionnaire.findOne({_id: req.params.id});
	res.send(questionnaire);
}));

router.post('/', asyncMiddleware(async function(req,res, next){
    let questionnaire = await Questionnaire.create(req.body);
    res.send(questionnaire);
}));

router.put('/:id', asyncMiddleware(async function(req, res, next) {
	let questionnaire = await Questionnaire.findOne({_id: req.params.id});
	questionnaire = await questionnaire.assign(req.body);
	res.send(questionnaire);
}));

module.exports = router;
