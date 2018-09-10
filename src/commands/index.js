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
const MODERATOR_COMMAND_INVITE = process.env.MODERATOR_COMMAND_INVITE || 'invite';
const ADMIN_COMMAND_KICK = process.env.ADMIN_COMMAND_KICK || 'kick';
const ADMIN_COMMAND_START = process.env.ADMIN_COMMAND_START || 'start_all';
const ADMIN_COMMAND_PENDING = process.env.ADMIN_COMMAND_PENDING || 'pending';
const MODERATOR_COMMAND_ADD_QUESTION = process.env.MODERATOR_COMMAND_ADD_QUESTION || 'add-question';

const notImplemented = (from, to, params)  => {
    return {message: 'This function has not yet been implemented', to: from};
};
const COMMANDS = {
    [COMMAND_HELP]: {
        restPath: '/help',
        adminOnly: false,
        hasParams: false,
        help: 'This command, show the available functions',
        func: staticMessage.help
    },
    [COMMAND_LIST]: {
        restPath: '/questionnaires',
        adminOnly: false,
        hasParams: false,
        help: 'Show what questionnaires you are a part of',
        func: questionnaire.listUser
    },
    [COMMAND_WHAT_NEXT]: {
        restPath: '/stuck',//'/?'
        adminOnly: false,
        hasParams: false,
        help: 'What to do next? Repeats the question.',
        func: users.whatNext
    },
    [COMMAND_JOIN]: {
        restPath: '/questionnaires/{id}/users',//POST
        adminOnly: false,
        hasParams: 'questionnaire_name',
        help: 'Join the list of users that the bot interacts with',
        func: users.join
    },
    [COMMAND_LEAVE]: {
        restPath: '/questionnaires/{id}/users',//DELETE
        adminOnly: false,
        hasParams: 'questionnaire_name',
        help: 'Leave the list of users that the bot interacts with',
        func: users.leave
    },
    [COMMAND_START]: {
        restPath: '/questionnaires/{id}/start',//POST
        adminOnly: false,
        hasParams: 'questionnaire_name',
        help: 'If enabled, start your questionnaire',
        func: questionnaire.startUser
    },
    [COMMAND_ADD_ANSWER]: {
        restPath: '/questionnaires/{id}/answers',//POST
        adminOnly: false,
        hasParams: 'answer',
        help: 'Answer a pending question',
        func: questionnaire.addAnswer
    },
    [MODERATOR_COMMAND_INVITE]: {
        restPath: '/questionnaires/{id}/users',//POST
        adminOnly: false,
        moderatorOnly:true,
        hasParams: 'questionnaire_name nick',
        help: 'Invite a user to the questionnaire',
        func: users.invite
    },
    [ADMIN_COMMAND_USERS]: {
        restPath: '/questionnaires/{id}/users',//GET
        adminOnly: true,
        hasParams: false,
        help: 'Shows a list of users',
        func: notImplemented
        // func: 'userList'
    },
    [ADMIN_COMMAND_PENDING]: {
        restPath: '/questionnaires/{id}/answers',//GET
        adminOnly: true,
        hasParams: 'nick (optional)',
        help: 'Shows a list of pending questionnaires, if a nick is supplied show the current answers for that user',
        func: notImplemented
        // func: 'pending'
    },
    [ADMIN_COMMAND_KICK]: {
        restPath: '/questionnaires/{id}/users/{userId}',//DELETE
        adminOnly: true,
        hasParams: 'nick',
        help: 'Remove a user from the list of users',
        func: notImplemented
        // func: 'userKick'
    },
    [ADMIN_COMMAND_START]: {
        restPath: '/questionnaires/{id}/start',
        adminOnly: true,
        moderatorOnly:true,
        hasParams: 'questionnaire_name nick (optional)',
        help: 'Start the questionnaire for everyone, if a nick is provided start it for that nick',
        func: questionnaire.startAll
        // func: 'adminStartQuestions'
    },
    [MODERATOR_COMMAND_ADD_QUESTION]: {
        restPath: '/questionnaires/{id}/questions',//POST
        adminOnly: false,
        moderatorOnly: true,
        hasParams: 'questionnaire_name question',
        help: 'Adds a question to the list of questions',
        func: questionnaire.addQuestion
    }
};

module.exports = COMMANDS;