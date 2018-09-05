/**
 * Sends the user the list of their questionnaires
 * @param user
 */
async function showList(user) {
    let message = '';

    try {
        let questionnaires = await this.db.questionnaire.findByNick(user, {name: 1});
        message += `You are a part of ${questionnaires.length} questionnaire${questionnaires.length > 1 ? 's' : ''}. ${questionnaires.map(item => item.name).join(', ')}`;
    }catch(e) {
        message = 'There was an error fetching your questionnaires';
        console.error(e);
    }

    this.client.say(user, message);

}

module.exports = showList;