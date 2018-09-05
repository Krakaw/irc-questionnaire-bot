module.exports = {
    userIsPartOfQuestionnaire(nick, questionnaire) {
        let currentUsers = questionnaire.users.map(user => user.nick.toLowerCase());
        return (currentUsers.indexOf(nick.toLowerCase()) > -1);
    }
};