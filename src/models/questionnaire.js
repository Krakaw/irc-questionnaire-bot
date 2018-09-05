class Questionnaire {
    constructor(db) {
        this.db = db;
        this.pending = {
            //QuestionnaireName: {UserNick: {}}
        }
    }

    create(questionnaire = {}) {

        questionnaire = {
            ...{
                name: '',
                active: true,
                questions: [],
                users: [
                    //{nick: "", isAdmin: false, active: true, pendingAccept: false}
                ],
                joinChannels: [],
                usersCanSelfJoin: true,
                usersCanSelfStart: true,
                usersCanRequestResults: true,
                sendResponsesTo: [],
                startAtHour: false,
                startOnDays: [],
                answers: [
                    //{nick: "", answers: {}, createdAt: ""}
                ],
                pending: {
                    //nick: {startedAt: 0, answers: {}, lastAnsweredAt: 0}
                },
                startMessage: '',
                finalMessage: ''
            },
            ...questionnaire
        };


        return new Promise(((resolve, reject) => {
            if (!questionnaire.name || /[^a-zA-Z0-9_-]+/.test(questionnaire.name)) {
                return reject({
                    errorType: 'invalidName',
                    message: 'Invalid name, cannot be blank or contain non a-zA-Z0-9_- characters'
                });
            }
            if (!questionnaire.adminUsers.length) {
                return reject({errorType: 'missingAdmin', message: 'You must have at least one admin user'});
            }
            this.db.insert(questionnaire, (err, newDoc) => {
                if (err) {
                    return reject(err);
                }
                return resolve(newDoc);
            });
        }));

    }

    async addUser(params, questionnaireId) {

        return new Promise((resolve, reject) => {
            const user = {
                ...{
                    nick: '',
                    isAdmin: false,
                    active: true,
                    pendingAccept: false
                },
                ...params
            };
            this.db.update({_id: questionnaireId}, {$push: {users: user}}, {}, (err, num) => {
                if (err) {
                    return reject(err);
                }
                return resolve(num);
            })
        });
    }

    async addQuestion(question, questionnaireName) {
        return new Promise((resolve, reject) => {
            question = question.trim();
            if (!question) {
                return reject('Question cannot be empty');
            }
            this.db.update({name: questionnaireName}, {$push: {questions: question}}, {}, (err, num) => {
                if (err) {
                    return reject(err);
                }
                return resolve(num);
            })
        });
    }

    async removeUser(nick, questionnaireId) {

        return new Promise((resolve, reject) => {
            this.db.update({_id: questionnaireId}, {$pull: {users: {nick: nick}}}, {}, (err, num) => {
                if (err) {
                    return reject(err);
                }
                return resolve(num);
            })
        });
    }

    async startQuestionnaire(nick, questionnaireId) {
        return new Promise(async (resolve, reject) => {
            let answerBlock = {
                nick,
                startedAt: new Date(),
                lastAnsweredAt: '',
                answers: {}
            };
            let result = await this.findBy({_id: questionnaireId}, {questions: 1}, true);
            result.questions.forEach(question => {
                answerBlock.answers[question] = '';
            });
            let pendingKey = `pending.${nick}`;

            return this.db.update({_id: questionnaireId}, {$set: { [pendingKey]: answerBlock}}, {}, function(err, num) {
                if (err) {
                    return reject(err);
                }
                return resolve(num)
            });

        });
    }

    async get(name) {
        return this.findBy({name}, null, true);
    }

    async findByNick(nick, projections, questionnaireName) {
        const conditions = {
            users: {
                $elemMatch: {
                    nick,
                    active: true
                }
            }
        };
        if (questionnaireName) {
            conditions.name = questionnaireName;
        }
        return this.findBy(conditions, projections);
    }

    async findBy(params = {}, projections = {}, findOne = false) {
        projections = projections || {};
        return new Promise((resolve, reject) => {
            const complete = (err, docs) => {
                if (err) {
                    return reject(err);
                }
                return resolve(docs);
            };
            if (findOne) {
                this.db.findOne(params, projections, complete);
            } else {
                this.db.find(params, projections, complete);
            }

        });
    }
}

module.exports = Questionnaire;