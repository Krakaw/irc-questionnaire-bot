/**
 *
 * @param from
 * @param to
 * @param params
 * @return {Promise<void>}
 */
async function startUser(from, to, params) {
    let questionnaires ;
    if (params.length === 0) {
        //No name was provided, use the first one we find for the user
        questionnaires = await this.db.questionnaire.findByNick(from);

    } else {
        const questionnaireName = params[0] || false;
        questionnaires = await this.db.questionnaire.findByNick(from, null, questionnaireName);
    }
    if (questionnaires.length) {
        let questionnaire = questionnaires[0];
        let result = await this.db.questionnaire.startQuestionnaire(from, questionnaire._id);
        console.log('res', result);

    } else {
        this.client.say(from ,'You have provided an invalid questionnaire name, or are not part of the questionnaire');
    }

}

async function addQuestion(from, to, params) {
    let questionnaireName = params.shift();
    let question = params.join(' ');

    if (!questionnaireName || !question) {
        //@TODO Error
        return;
    }

    let result = await this.db.questionnaire.addQuestion(question, questionnaireName);
    console.log(result);
}

module.exports = {
    startUser,
    addQuestion
};