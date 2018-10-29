var express = require('express');
var router = express.Router();
const Q = require('../models/questionnaire');
/* GET home page. */
router.get('/', async function(req, res, next) {

  try {
	let result = await Q.create({name: "Roaaaa"});

	  // let result = await Q.find();
	  res.send(result);
  } catch (e) {
      next(e);
  }

});

module.exports = router;
