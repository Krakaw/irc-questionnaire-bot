const staticMessage = require('./static-messages');
const users = require('./users');
const questionnaire = require('./questionnaire');

const COMMAND_HELP = process.env.COMMAND_HELP || 'help';
const COMMAND_WHAT_NEXT = process.env.COMMAND_WHAT_NEXT || '?';
const COMMAND_JOIN = process.env.COMMAND_JOIN || 'join';
const COMMAND_LEAVE = process.env.COMMAND_LEAVE || 'leave';
const COMMAND_LIST = process.env.COMMAND_LIST || 'list';
const COMMAND_START = process.env.COMMAND_START || 'start';
const COMMAND_ADD_ANSWER = process.env.COMMAND_ADD_ANSWER || 'add-answer';
const ADMIN_COMMAND_USERS = process.env.ADMIN_COMMAND_USERS || 'users';
const ADMIN_COMMAND_INVITE = process.env.ADMIN_COMMAND_INVITE || 'invite';
const ADMIN_COMMAND_KICK = process.env.ADMIN_COMMAND_KICK || 'kick';
const ADMIN_COMMAND_START = process.env.ADMIN_COMMAND_START || 'start_all';
const ADMIN_COMMAND_PENDING = process.env.ADMIN_COMMAND_PENDING || 'pending';
const ADMIN_COMMAND_ADD_QUESTION = process.env.ADMIN_COMMAND_ADD_QUESTION || 'add-question';


const COMMANDS = {
    [COMMAND_HELP]: {
        adminOnly: false,
        hasParams: false,
        help: 'This command, show the available functions',
        func: staticMessage.help
    },
    [COMMAND_LIST]: {
        adminOnly: false,
        hasParams: false,
        help: 'Show what questionnaires you are a part of',
        func: questionnaire.listUser
    },
    [COMMAND_WHAT_NEXT]: {
        adminOnly: false,
        hasParams: false,
        help: 'What to do next? Repeats the question.',
        func: users.whatNext
    },
    [COMMAND_JOIN]: {
        adminOnly: false,
        hasParams: 'questionnaire_name',
        help: 'Join the list of users that the bot interacts with',
        func: users.join
    },
    [COMMAND_LEAVE]: {
        adminOnly: false,
        hasParams: 'questionnaire_name',
        help: 'Leave the list of users that the bot interacts with',
        func: users.leave
    },
    [COMMAND_START]: {
        adminOnly: false,
        hasParams: 'questionnaire_name',
        help: 'If enabled, start your questionnaire',
        func: questionnaire.startUser
    },
    [COMMAND_ADD_ANSWER]: {
        adminOnly: false,
        hasParams: 'answer',
        help: 'Answer a pending question',
        func: questionnaire.addAnswer
    },
    [ADMIN_COMMAND_USERS]: {
        adminOnly: true,
        hasParams: false,
        help: 'Shows a list of users',
        func: 'userList'
    },
    [ADMIN_COMMAND_INVITE]: {
        adminOnly: true,
        hasParams: 'nick notify[0|1]',
        help: 'Adds a user to the list of users',
        func: 'userInvite'
    },
    [ADMIN_COMMAND_PENDING]: {
        adminOnly: true,
        hasParams: 'nick (optional)',
        help: 'Shows a list of pending questionnaires, if a nick is supplied show the current answers for that user',
        func: 'pending'
    },
    [ADMIN_COMMAND_KICK]: {
        adminOnly: true,
        hasParams: 'nick',
        help: 'Remove a user from the list of users',
        func: 'userKick'
    },
    [ADMIN_COMMAND_START]: {
        adminOnly: true,
        hasParams: 'nick (optional)',
        help: 'Start the questionnaire for everyone, if a nick is provided start it for that nick',
        func: 'adminStartQuestions'
    },
    [ADMIN_COMMAND_ADD_QUESTION]: {
        adminOnly: true,
        hasParams: 'questionnaire_name question',
        help: 'Adds a question to the list of questions',
        func: questionnaire.addQuestion
    }
};

module.exports = COMMANDS;