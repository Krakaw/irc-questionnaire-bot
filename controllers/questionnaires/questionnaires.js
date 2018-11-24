const Questionnaire = require('../../models/questionnaire');
module.exports = {
	//Trigger the questionnaire
	async start(id) {
		const questionnaire = await Questionnaire.findOne({_id: req.params.id});
		questionnaire.client.forEach(client => {
			console.log(client);
		})
	}
};