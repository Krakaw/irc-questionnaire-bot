const userIsPartOfQuestionnaire = require('./helpers').userIsPartOfQuestionnaire;
/**
 * A user can join the questionnaire
 * @param user
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

    this.client.say(from, message);

}

/**
 * A user can leave the questionnaire
 * @param from
 * @param to
 * @param params
 * @return {Promise<void>}
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

    this.client.say(from, message);

}

/**
 *
 * @type {{join: join, leave: leave}}
 */
module.exports = {
    join,
    leave
};