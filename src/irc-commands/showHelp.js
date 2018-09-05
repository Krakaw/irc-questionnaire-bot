/**
 * Sends the user the help text for the available commands
 * @param user
 */
function showHelp(user) {
    let helpMessage = `${this.botName} is a questionnaire bot, it will PM you a set of questions and store your answers\n`;
    const isAdmin = user === this.ircAdminNick;
    for (let commandText in this.COMMANDS) {
        let command = this.COMMANDS[commandText];
        if (command.adminOnly && !isAdmin) {
            //User is not the admin, so don't show adminOnly commands
            continue;
        }
        helpMessage += `${this.commandInitializer} ${commandText} ${command.hasParams || ''} - ${command.help}\n`;
    }
    this.client.say(user, helpMessage);
}

module.exports = showHelp;