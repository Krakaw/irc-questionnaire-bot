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
                questions: [
                    //@TODO Implement options
                    //{question: "", options: [], createdAt: ""}
                ],
                users: [
                    //{nick: "", isAdmin: false, active: true, pendingAccept: false}
                ],
                answers: [
                    //{nick: "", answers: {}, createdAt: ""}
                ],
                pending: [
                    //nick: {startedAt: 0, answers: {}, lastAnsweredAt: 0}
                ],
                joinChannels: [],
                usersCanSelfJoin: true,
                usersCanSelfStart: true,
                usersCanRequestResults: true,
                sendResponsesTo: [],
                startAtHour: false,
                startOnDays: [],
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
            if (typeof question === 'string') {
                question = {
                    question,
                    createdAt: new Date(),
                    options: []
                }
            }
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

    /**
     * Returns any pending questionnaires for the user
     * @param nick
     * @param questionnaireId
     * @return {Promise<*>}
     */
    async findPendingForUser(nick, questionnaireId = false) {

        let check = `pending.${nick}`;
        const conditions = {
            [check]: {
                $exists: true
            }
        };
        if (questionnaireId) {
            conditions._id = questionnaireId;
        }
        return this.findBy(conditions, null, !!questionnaireId);
    }

    /**
     * Creates a pending entry for the specific nick
     * @param nickOrData
     * @param questionnaireId
     * @return {Promise<any>}
     */
    async createPendingEntry(nickOrData, questionnaireId) {
        return new Promise(async (resolve, reject) => {
            if (typeof nickOrData === 'string') {
                nickOrData = {
                    nick: nickOrData
                };
            }
            let answerBlock = {
                ... {
                    nick: '',
                    startedAt: new Date(),
                    lastAnsweredAt: '',
                    answers: {}
                },
                ...nickOrData
            };
            //Get the questions from the questionnaire
            let result = await this.findBy({_id: questionnaireId}, {questions: 1}, true);

            result.questions.forEach(question => {
                if (!answerBlock.answers.hasOwnProperty(question)) {
                    answerBlock.answers[question] = '';
                }

            });

            let pendingKey = `pending.${nickOrData.nick}`;

            return this.db.update({_id: questionnaireId}, {$set: {[pendingKey]: answerBlock}}, {}, function (err, num) {
                if (err) {
                    return reject(err);
                }
                return resolve(num)
            });

        });
    }

    async addAnswerToPendingEntry(nick, answer, moveOnComplete = true) {
        //Check if we have any pendingQuestionnaires answers for this user. Add the answer or tell them to start a questionnaire
        let pendingQuestionnaires = await this.findPendingForUser(nick);

        if (pendingQuestionnaires && pendingQuestionnaires.length) {
            //Take the first questionnaire
            let questionnaire = pendingQuestionnaires.shift();
            //Grab the pending block
            const pendingAnswers = questionnaire.pending[nick];
            //Loop through the questions to ask

            for (let i in questionnaire.questions) {
                const question = questionnaire.questions[i];
                let isLastQuestion = i == questionnaire.questions.length - 1;

                if (pendingAnswers.answers[question] === '') {
                    //This is the first unanswered question, answer it and ask the next
                    pendingAnswers.lastAnsweredAt = new Date();
                    pendingAnswers.answers[question] = answer;
                    await this.createPendingEntry(pendingAnswers, questionnaire._id);
                    if (isLastQuestion && moveOnComplete) {
                        //We have answered the last question
                        //Store the answer in answers
                        await this.movePendingAnswerToComplete()
                    }
                    return {
                        hasCompleted: isLastQuestion,
                        currentIndex: +i,
                        questionnaire
                    };
                }

            }
            //Should never reach here
            //We probably just need to move the pending answers maybe something happened
            await this.movePendingAnswerToComplete(nick, questionnaire._id);
        } else {
            throw {message: `You have not started a questionnaire`};

        }
    }

    async movePendingAnswerToComplete(nick, questionnaireId) {
        let result = await this.findPendingForUser(nick, questionnaireId);
        let pendingResultKey = `pending.${nick}`;
        console.log(result.pending);
        return new Promise((resolve, reject) => {
            //Remove pending
            this.db.update({_id: questionnaireId}, {
                $push: {
                    answers: result.pending[nick]
                },
                $unset: {
                    [pendingResultKey]: true
                }
            }, {}, (err, num) => {
                if (err) {
                    console.err(err);
                    return reject(err);
                }
                resolve(num);
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