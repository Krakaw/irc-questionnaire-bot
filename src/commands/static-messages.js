/**
 * Sends the user the help text for the available commands
 * @param user
 */
async function help(user) {
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
    return {message: helpMessage, to: user};
}

module.exports = {
    help
};