const uri = `${process.env.DATA_DIR}questionnaires.nedb`;
const {Model, SoftDeletes} = require('nedb-models')


class Questionnaire extends Model {

	static datastore() {
		return {
			filename: uri
		}
	}


	_validateQuestions(questions) {
		let texts = questions.map(question => question.question.toLowerCase().trim());
		if (texts.filter(text => text === "").length) {
			throw {message: "Question cannot be blank"};
		}
		if ((new Set(texts)).length !== texts.length) {
			throw {message: "Cannot duplicate questions"};
		}
		return true;
	}

	async addQuestion(question = {}) {
		question = {
			...{
				question: "",
				options: [],
				createdAt: Date.now()
			}, ...question
		};
		let questionText = question.question.trim();
		if (!questionText) {
			throw {message: "Question cannot be blank"};
		}
		if (this.questions.filter(item => item.question.toLowerCase() === questionText.toLowerCase()).length) {
			throw {message: `${questionText} already exists`};
		}

		this.questions.push(question);
		return await this.save();
	}

	async updateQuestion(index, question = {}) {
		let updatedQuestion = {...this.questions[index], ...question};
		this.questions.splice(index, 1, updatedQuestion);
		this._validateQuestions(this.questions);
		return await this.save();
	}

	async deleteQuestion(index = -1) {
		this.questions.splice(index, 1);
		return await this.save();
	}

	async addUser(user = {}) {
		user = {
			...user,
			...{
				userId: "",
				isModerator: false,
				pendingAccept: false,
				active: true,
			}
		};
		if (this.users.filter(item => item.userId).length) {
			throw {message: "User is already part of this questionnaire"};
		}
		this.users.push(user);
		return await this.save();
	}

	async updateUser(userId, user = {}) {
		throw {message: "Not implemented yet"};
	}

	async deleteUser(userId) {
		throw {message: "Not implemented yet"};
	}

}

Questionnaire.defaults = () => {
	return {
		...Model.defaults(), values: {
			name: '',
			active: true,
			questions: [
				//@TODO Implement options
				//{question: "", options: [], createdAt: ""}
			],
			users: [
				//{userId: "", nick: "", isModerator: false, active: true, pendingAccept: false}
			],
			client: [
				// {
				//type: 'irc', channels: [], ...options
				//sendResponsesTo:[{channel: "", nick: ""}]
				// }
			],
			permissions: {
				joiningRequiresKey: false,
				usersCanSelfStart: true,
				usersCanRequestResults: true,
				onlyModeratorsCanAddQuestions: true,
				onlyModeratorsCanInvite: true,
			},
			cron: [
				{
					days: [],
					HHmm: ""//24 hour e.g. 14:23
				}
			],
			messages: {
				startMessage: '',
				finalMessage: ''
			}
		}
	};
};
Questionnaire.use(SoftDeletes);
Questionnaire.ensureIndex({
	fieldName: 'name',
	unique: true,
	onload(err) {
		if (err) {
			console.error(`Error creating index`);
			console.error(err);
		}
	}
});
module.exports = Questionnaire;