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
                    //{nick: "", isModerator: false, active: true, pendingAccept: false}
                ],
                answers: [
                    //{nick: "", answers: {}, createdAt: ""}
                ],
                pending: {
                    //nick: {startedAt: 0, answers: {}, lastAnsweredAt: 0}
                },
                joinChannels: [],
                usersCanSelfJoin: true,
                usersCanSelfStart: true,
                usersCanRequestResults: true,
                onlyModeratorsCanAddQuestions: true,//@TODO Implement this logic
                onlyModeratorsCanInvite: true,//@TODO Implement this logic
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

            this.db.insert(questionnaire, (err, newDoc) => {
                if (err) {
                    return reject(err);
                }
                return resolve(newDoc);
            });
        }));

    }

    /**
     * Add a question to the list of questions
     * @param question
     * @param questionnaireName
     * @return {Promise<any>}
     */
    async addQuestion(question, questionnaireName) {
        return new Promise((resolve, reject) => {
            if (typeof question === 'string') {
                question = question.trim();
                question = {
                    question,
                }
            }
            question = {
                ...{
                    question: '',
                    createdAt: new Date(),
                    options: []
                },
                ...question
            };

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

    async getQuestions(questionnaireIdOrName) {
        let questionnaire = await this.get(questionnaireIdOrName, {questions:1});
        return questionnaire.questions;
    }

    /**
     * Adds a user to a questionnaire
     * If they are the first user set them as a moderator
     * @param params
     * @param questionnaireId
     * @return {Promise<any>}
     */
    async addUser(params, questionnaireId) {
        if (typeof params === 'string') {
            params = {
                nick: params
            };
        }
        return new Promise(async (resolve, reject) => {
            const user = {
                ...{
                    nick: '',
                    isModerator: false,
                    active: true,
                    pendingAccept: false
                },
                ...params
            };
            //Check if this user is already part of the questionnaire
            let userExists = await this.findByNick(params.nick, {name: 1}, questionnaireId);
            if (userExists.length) {
                return reject({
                    message: `${params.nick} is already a part of ${userExists[0].name}`
                });
            }

            //If there are no users the first one is a moderator
            let questionnaire = await this.get(questionnaireId, {users: 1});
            if (questionnaire.users.length === 0) {
                user.isModerator = true;
            }
            this.db.update({_id: questionnaireId}, {$push: {users: user}}, {}, (err, num) => {
                if (err) {
                    return reject(err);
                }
                return resolve(num);
            })
        });
    }


    /**
     * Removes a user
     * @param nick
     * @param questionnaireId
     * @return {Promise<any>}
     */
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
                if (!answerBlock.answers.hasOwnProperty(question.question)) {
                    answerBlock.answers[question.question] = '';
                }

            });

            let pendingKey = `pending.${answerBlock.nick}`;
            return this.db.update({_id: questionnaireId}, {$set: {[pendingKey]: answerBlock}}, {}, function (err, num) {
                if (err) {
                    return reject(err);
                }
                return resolve(num)
            });

        });
    }

    /**
     * Adds an answer to the pending entry, if moveOnComplete is true and the answer is the last answer it will move the pending result to answers
     * @param nick
     * @param answer
     * @param moveOnComplete
     * @return {Promise<{hasCompleted: boolean, currentIndex: number, questionnaire: T}>}
     */
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
                i = parseInt(i);
                let isLastQuestion = (i === questionnaire.questions.length - 1);

                if (pendingAnswers.answers[question.question] === '') {
                    //This is the first unanswered question, answer it and ask the next
                    pendingAnswers.lastAnsweredAt = new Date();
                    pendingAnswers.answers[question.question] = answer;
                    await this.createPendingEntry(pendingAnswers, questionnaire._id);
                    if (isLastQuestion && moveOnComplete) {
                        //We have answered the last question
                        //Store the answer in answers
                        await this.movePendingAnswerToComplete(nick, questionnaire._id);
                    }
                    return {
                        hasCompleted: isLastQuestion,
                        currentIndex: i,
                        questionnaire
                    };
                } else {
                    if (isLastQuestion) {
                        await this.movePendingAnswerToComplete(nick, questionnaire._id);
                    }
                    return {
                        hasCompleted: isLastQuestion,
                        currentIndex: i,
                        questionnaire
                    };
                }

            }
        } else {
            throw {message: `You have not started a questionnaire`};

        }
    }

    /**
     * Takes a pending result out of the pending: {} object and pushes it into the answers array
     * @param nick
     * @param questionnaireId
     * @return {Promise<any>}
     */
    async movePendingAnswerToComplete(nick, questionnaireId) {
        let result = await this.findPendingForUser(nick, questionnaireId);
        let pendingResultKey = `pending.${nick}`;
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
                    console.error(err);
                    return reject(err);
                }
                resolve(num);
            });
        });

    }


    /**
     * Get a questionnaire by its name or _id
     * @param nameOrId
     * @param projections
     * @return {Promise<*>}
     */
    async get(nameOrId, projections) {
        return this.findBy({
            $or: [{
                _id: nameOrId
            }, {name: nameOrId}]
        }, projections, true);
    }

    /**
     * Get a list of questionnaires that have a user with nick: nick
     * Optional questionnaire name filter
     * @param nick
     * @param projections
     * @param questionnaireNameOrId
     * @return {Promise<*>}
     */
    async findByNick(nick, projections, questionnaireNameOrId) {
        if (typeof nick === 'string') {
            nick = {
                nick
            };
        }
        if (!nick.nick) {
            throw {message: 'You must specify a nick to lookup'};
        }
        const conditions = {
            users: {
                $elemMatch: {
                    ...{
                        nick: '',
                        active: true
                    },
                    ...nick

                }
            }
        };
        if (questionnaireNameOrId) {
            conditions['$or'] = [
                {
                    name: questionnaireNameOrId
                },
                {
                    _id: questionnaireNameOrId
                }
            ]
        }
        return this.findBy(conditions, projections);
    }

    /**
     * Generic find method
     * @param params
     * @param projections
     * @param findOne
     * @return {Promise<any>}
     */
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