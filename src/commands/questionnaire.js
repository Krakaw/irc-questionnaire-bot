/**
 * Start a user questionnaire
 * @param from
 * @param to
 * @param params
 * @return {Promise<*>}
 */
async function startUser(from, to, params) {
    let questionnaires;
    if (params.length === 0) {
        //No name was provided, use the first one we find for the user
        questionnaires = await this.db.questionnaire.findByNick(from);

    } else {
        const questionnaireName = params[0] || false;
        questionnaires = await this.db.questionnaire.findByNick(from, null, questionnaireName);
    }
    if (questionnaires.length) {
        let questionnaire = questionnaires[0];
        try {
            let result = await this.db.questionnaire.createPendingEntry(from, questionnaire._id);
            return {
                silent: true,
                next: {
                    command: process.env.INTERNAL_COMMAND_SAY,
                    params: [
                        from,
                        questionnaire.questions.shift()
                    ]
                }
            }
        } catch (e) {
            console.error(e);
            throw {message: `Failed to start the ${questionnaireName} questionnaire`};
        }
    } else {
        return {
            to: from,
            message: 'You have provided an invalid questionnaire name, or are not part of the questionnaire'
        };
    }

}

/**
 * Add a question to a specific questionnaire
 * @param from
 * @param to
 * @param params
 * @return {Promise<{message: string, to: *}>}
 */
async function addQuestion(from, to, params) {
    let questionnaireName = params.shift();
    let question = params.join(' ');

    if (!questionnaireName || !question) {
        throw {message: `You must specify a questionnaire name {${questionnaireName}} and question {${question}}`};
    }

    try {
        let result = await this.db.questionnaire.addQuestion(question, questionnaireName);
        if (result) {
            return {message: `Successfully added ${question} to ${questionnaireName}`, to: from};
        }
    } catch (e) {
        console.error(e);
    }
    throw {message: 'Failed to added your question'};

}

/**
 * Sends the user the list of their questionnaires
 * @param user
 * @return {Promise<{message: string, to: *}>}
 */
async function listUser(user) {
    let message = '';

    try {
        let questionnaires = await this.db.questionnaire.findByNick(user, {name: 1});
        message += `You are a part of ${questionnaires.length} questionnaire${questionnaires.length > 1 ? 's' : ''}. ${questionnaires.map(item => item.name).join(', ')}`;
    } catch (e) {
        message = 'There was an error fetching your questionnaires';
        console.error(e);
    }
    return {message, to: user};
}

async function addAnswer(from, to, params) {

    try {
        let result = await this.db.questionnaire.addAnswerToPendingEntry(from, params.join(' '), true);
        return {
            to: from,
            message: result.hasCompleted ?
                result.questionnaire.finalMessage :
                result.questionnaire.questions[++result.currentIndex]
        }
    }catch (e) {
        return {to: from, message: e.message || 'There was an error adding your answer'};
    }


}

/**
 *
 * @type {{startUser: startUser, addQuestion: addQuestion, listUser: listUser}}
 */
module.exports = {
    addAnswer,
    startUser,
    addQuestion,
    listUser
};