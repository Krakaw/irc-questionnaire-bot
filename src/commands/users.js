const userIsPartOfQuestionnaire = require('./helpers').userIsPartOfQuestionnaire;

/**
 * A user can join the questionnaire
 * @param from
 * @param to
 * @param params
 * @return {Promise<{message: string, to: *}>}
 */
async function join(from, to, params) {
    let message = '';


    try {
        const questionnaireName = params[0];
        let questionnaire = await this.db.questionnaire.findBy({name: questionnaireName, usersCanSelfJoin: true}, null, true);

        if (questionnaire) {
            if (userIsPartOfQuestionnaire(from ,questionnaire)) {
                message = `You are already part of ${questionnaireName}`;
            } else {
                //Add to the questionnaire
                let result = await this.db.questionnaire.addUser({nick: from}, questionnaire._id);
                if (result) {
                    message  = `You have been added to ${questionnaireName}`;
                }
            }
        } else {
            message = `Invalid questionnaire ${questionnaireName}`;
        }
        // message += `You are a part of ${questionnaires.length} questionnaire${questionnaires.length > 1 ? 's' : ''}. ${questionnaires.map(item => item.name).join(', ')}`;
    } catch (e) {
        message = 'There was an error fetching adding you to the questionnaire';
        console.error(e);
    }
    return {message, to: from};

}

/**
 * A user can leave the questionnaire
 * @param from
 * @param to
 * @param params
 * @return {Promise<{message: string, to: *}>}
 */
async function leave(from, to, params) {
    let message = '';


    try {
        const questionnaireName = params[0];
        let questionnaire = await this.db.questionnaire.findBy({name: questionnaireName}, null, true);

        if (questionnaire) {
            if (!userIsPartOfQuestionnaire(from ,questionnaire)) {
                message = `You are not a part of ${questionnaireName}`;
            } else {
                //Add to the questionnaire
                let result = await this.db.questionnaire.removeUser(from, questionnaire._id);
                if (result) {
                    message  = `You have been remove from ${questionnaireName}`;
                }
            }
        } else {
            message = `Invalid questionnaire ${questionnaireName}`;
        }
        // message += `You are a part of ${questionnaires.length} questionnaire${questionnaires.length > 1 ? 's' : ''}. ${questionnaires.map(item => item.name).join(', ')}`;
    } catch (e) {
        message = 'There was an error fetching removing you from the questionnaire';
        console.error(e);
    }

    return {message, to: from};

}

/**
 * Checks if the user is currently answering a questionnaire and resends the question
 * Otherwise tells them how to start a questionnaire
 * @param from
 * @param to
 * @param params
 * @return {Promise<{message: *}>}
 */
async function whatNext(from, to, params) {
    let message = 'Whats next?';
    return {message, to: from};
}

/**
 *
 * @type {{join: join, leave: leave, whatNext: whatNext}}
 */
module.exports = {
    join,
    leave,
    whatNext
};