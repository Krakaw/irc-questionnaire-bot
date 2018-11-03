const uri = `${process.env.DATA_DIR}answers.nedb`;
const {Model, SoftDeletes} = require('nedb-models')


class Answer extends Model {

	static datastore() {
		return {
			filename: uri
		}
	}
}

Answer.defaults = () => {
	return {
		...Model.defaults(), values: {
			userId: "",
			questionnaireId: "",
			identifyBy: "",//The nick
			answers: {},
			incomplete: true,
			createdAt: "",
			completedAt: ""
		}
	};
};
Answer.use(SoftDeletes);
Answer.ensureIndex({
	fieldName: 'identifyBy',
	unique: false,
	onload(err) {
		if (err) {
			console.error(`Error creating index`);
			console.error(err);
		}
	}
});
Answer.ensureIndex({
	fieldName: 'userId',
	unique: false,
	onload(err) {
		if (err) {
			console.error(`Error creating index`);
			console.error(err);
		}
	}
});
Answer.ensureIndex({
	fieldName: 'questionnaireId',
	unique: false,
	onload(err) {
		if (err) {
			console.error(`Error creating index`);
			console.error(err);
		}
	}
});
module.exports = Answer;