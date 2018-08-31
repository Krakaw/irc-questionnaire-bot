const fs = require('fs');
require('dotenv').config();
const irc = require('irc');

const DEBUG = process.env.DEBUG || false;

const IRC_SERVER = process.env.IRC_SERVER;
const IRC_NICK = process.env.IRC_NICK;
const IRC_PASS = process.env.IRC_PASS;
const IRC_ADMIN_NICK = process.env.IRC_ADMIN_NICK;
const IRC_PUBLIC_CHANNEL = process.env.IRC_PUBLIC_CHANNEL;

const BOT_NAME = process.env.BOT_NAME || 'Questionnaire Bot';

const RESULTS_START_MESSAGE = process.env.RESULTS_START_MESSAGE;
const FINAL_MESSAGE = process.env.FINAL_MESSAGE || '';

const USER_FILE_PATH = process.env.USERS_FILE || 'users.json';
const QUESTION_FILE_PATH = process.env.QUESTIONS_FILE || 'questions.json';
const ANSWER_FILE_PATH = process.env.ANSWERS_FILE || 'answers.txt';

const USERS_CAN_START_THERE_OWN_QUESTIONNAIRE = process.env.USERS_CAN_START_THERE_OWN_QUESTIONNAIRE || 0;

const COMMAND_INITIALIZER = process.env.COMMAND_INITIALIZER || '!q-bot';

const COMMAND_HELP = process.env.COMMAND_HELP || 'help';
const COMMAND_JOIN = process.env.COMMAND_JOIN || 'join';
const COMMAND_LEAVE = process.env.COMMAND_LEAVE || 'leave';
const COMMAND_START = process.env.COMMAND_START || 'start';
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
        func: showHelp
    },
    [COMMAND_JOIN]: {
        adminOnly: false,
        hasParams: false,
        help: 'Join the list of users that the bot interacts with',
        func: userJoin
    },
    [COMMAND_LEAVE]: {
        adminOnly: false,
        hasParams: false,
        help: 'Leave the list of users that the bot interacts with',
        func: userLeave
    },
    [COMMAND_START]: {
        adminOnly: false,
        hasParams: false,
        help: 'If enabled, start your questionnaire',
        func: userStartQuestions
    },

    [ADMIN_COMMAND_USERS]: {
        adminOnly: true,
        hasParams: false,
        help: 'Shows a list of users',
        func: userList
    },
    [ADMIN_COMMAND_INVITE]: {
        adminOnly: true,
        hasParams: 'nick notify[0|1]',
        help: 'Adds a user to the list of users',
        func: userInvite
    },
    [ADMIN_COMMAND_PENDING]: {
        adminOnly: true,
        hasParams: 'nick (optional)',
        help: 'Shows a list of pending questionnaires, if a nick is supplied show the current answers for that user',
        func: pending
    },
    [ADMIN_COMMAND_KICK]: {
        adminOnly: true,
        hasParams: 'nick',
        help: 'Remove a user from the list of users',
        func: userKick
    },
    [ADMIN_COMMAND_START]: {
        adminOnly: true,
        hasParams: 'nick (optional)',
        help: 'Start the questionnaire for everyone, if a nick is provided start it for that nick',
        func: adminStartQuestions
    },
    [ADMIN_COMMAND_ADD_QUESTION]: {
        adminOnly: true,
        hasParams: 'question',
        help: 'Adds a question to the list of questions',
        func: addQuestion
    }
};

if (DEBUG) {
    console.log(`Connecting to ${IRC_SERVER} as ${IRC_NICK} with${IRC_PASS ? ' password' : 'out a password'}`);
    console.log(`Taking commands from ${IRC_ADMIN_NICK} in public channel ${IRC_PUBLIC_CHANNEL}`);
}

if (!IRC_SERVER || !IRC_NICK || !IRC_ADMIN_NICK || !IRC_PUBLIC_CHANNEL) {
    console.error('Missing IRC_SERVER or IRC_NICK or IRC_ADMIN_NICK or IRC_PUBLIC_CHANNEL');
    process.exit(1);
}

const users = readUsers();
const questions = readQuestions();
const responses = {}; //{user: {started: new Date(), answers: {}}}

const client = new irc.Client(IRC_SERVER, IRC_NICK, {
    userName: IRC_NICK,
    password: IRC_PASS,
    channels: [IRC_PUBLIC_CHANNEL],
    realName: BOT_NAME,
    debug: false,
    sasl: true,
    autoConnect: false
});

client.addListener('message', function (from, to, message) {
    // console.log(from + ' => ' + to + ': ' + message);
    message = message.trim();
    //Check if the command initializer has been said
    if (message[0] === '!' && message.substr(0, COMMAND_INITIALIZER.length) === COMMAND_INITIALIZER) {
        processCommands(from, to, message);
    } else if (
        to === IRC_NICK &&
        users.indexOf(from) > -1 &&
        responses.hasOwnProperty(from)) {
        //Is it a direct message and the from user is in our list of users and we are expecting a response
        //This is a message to the bot from someone in our user list
        addAnswer(from, message);
    }


});

function processCommands(from, to, messageString) {
    //We must execute a command
    let commandParts = messageString.split(' ');
    //Remove the command initializer
    commandParts.splice(0, 1);
    if (commandParts.length === 0) {
        //No commands added
        client.say(from, 'Invalid command');
        showHelp(from);
        return;
    }

    const command = commandParts.shift();
    const params = commandParts;

    if (DEBUG) {
        console.log('Command received:', command, params);
    }
    //Check if the command exists.
    if (!COMMANDS.hasOwnProperty(command)) {
        client.say(from, 'Invalid command');
        showHelp(from);
        return;
    }

    //Check if only admins can run it
    const commandIsAdmin = COMMANDS[command].adminOnly;
    if (commandIsAdmin && from !== IRC_ADMIN_NICK) {
        client.say(from, 'You do not have permission to run that command');
        return;
    }

    //Run the command
    COMMANDS[command].func(from, to, COMMANDS[command].hasParams ? params : null);

}

client.addListener('error', function (message) {
    console.log('error: ', message);
    if (message.command === 'err_nosuchnick') {
        const user = message.args[1];
        console.log(`${user} not online at ${new Date()}`);
        try {

            delete responses[user];
        } catch (e) {

        }
    }
});

client.connect(0, () => {
    console.log('Connected');
});

/**
 * Sends the user the help text for the available commands
 * @param user
 */
function showHelp(user) {
    let helpMessage = `${BOT_NAME} is a questionnaire bot, it will PM you a set of questions and broadcast your answers back to ${IRC_PUBLIC_CHANNEL}\n`;
    const isAdmin = user === IRC_ADMIN_NICK;
    for (let commandText in COMMANDS) {
        let command = COMMANDS[commandText];
        if (command.adminOnly && !isAdmin) {
            //User is not the admin, so don't show adminOnly commands
            continue;
        }
        helpMessage += `${COMMAND_INITIALIZER} ${commandText} ${command.hasParams || ''} - ${command.help}\n`;
    }
    client.say(user, helpMessage);
}

/**
 * Show a list of pending responses
 * If a nick is supplied then show that user's actual responses
 * @param from
 * @param to
 * @param listOfNicks
 */
function pending(from, to, listOfNicks) {
    let nick = false;
    if (listOfNicks.length > 0) {
        nick = listOfNicks.shift();
    }
    let message = '';
    if (nick) {
        //Show all of the responses for this nick
        if (responses.hasOwnProperty(nick)) {
            message += `${nick}'s answers from ${responses[nick].started}:\n`;
            questions.forEach(question => {
                message += `${question}\n> ${responses[nick].answers[question] || '(No Answer)'}\n`;
            });
        } else {
            message = `${nick} has no pending responses`;
        }
    } else {
        //Show all the users summary

        let hasLiveResponses = false;
        for (let user in responses) {
            hasLiveResponses = true;
            let answerCount = 0;
            for (let answer in responses[user].answers) {
                if (responses[user].answers[answer]) {
                    answerCount++;
                }
            }
            message += `${user} started at ${responses[user].started} - (${answerCount} / ${questions.length})\n`;
        }
        if (!hasLiveResponses) {
            message = 'There are no pending responses';
        }
    }

    client.say(IRC_ADMIN_NICK, message);

}

/**
 * A User can start their own questionnaire
 * @param from
 * @param to
 */
function userStartQuestions(from, to) {
    if (USERS_CAN_START_THERE_OWN_QUESTIONNAIRE) {
        startQuestionsForUser(from);
    } else {
        client.say(from, 'Only the admin can start the daily questionnaire.');
    }
}

/**
 * Starts the questionnaire process
 * If there is no list of nicks specified then we poll all the users
 * @param from
 * @param to
 * @param listOfNicks Optional
 */
function adminStartQuestions(from, to, listOfNicks) {

    let usersToPoll = users;
    if (listOfNicks.length > 0) {
        usersToPoll = listOfNicks;
    }

    usersToPoll.forEach(user => {
        startQuestionsForUser(user);
    });
}

/**
 * Initializes the responses for the specific user
 * @param user
 */
function startQuestionsForUser(user) {
    responses[user] = {
        nick: user,
        started: new Date(),
        lastAnswer: false,
        answers: {}
    };

    askQuestion(user, questions[0])
}

/**
 * Sends the question to the user via a direct message
 * @param user
 * @param question
 */
function askQuestion(user, question) {
    responses[user].answers[question] = false;
    client.say(user, question);
}

/**
 * Adds the users's direct messages response to their responses
 * Once all of the questions have been answered their answers are stored and sent to the IRC_PUBLIC_CHANNEL
 * @param user
 * @param answer
 */
function addAnswer(user, answer) {
    for (let i in questions) {
        let question = questions[i];
        if (!responses[user].answers.hasOwnProperty(question)) {
            continue;
        }
        let hasNextQuestion = i < questions.length - 1;
        if (responses[user].answers[question] === false) {
            responses[user].lastAnswer = new Date();
            responses[user].answers[question] = answer;
            if (hasNextQuestion) {
                askQuestion(user, questions[parseInt(i) + 1]);
                return;
            } else {
                if (FINAL_MESSAGE) {
                    client.say(user, FINAL_MESSAGE);
                }
                if (DEBUG) {
                    console.log(`${new Date()} - Storing ${user} answers`);
                }
                postToChannel(user);
                storeAnswer(user);
                //Now delete the answer
                delete responses[user];
            }
        }
    }
}

/**
 * Posts a formatted version of the user results to the IRC_PUBLIC_CHANNEL
 * @param user
 */
function postToChannel(user) {
    client.say(IRC_PUBLIC_CHANNEL, RESULTS_START_MESSAGE.replace(/{user}/g, user));
    questions.forEach(question => {
        client.say(IRC_PUBLIC_CHANNEL, question);
        client.say(IRC_PUBLIC_CHANNEL, `> ${responses[user].answers[question]}`);
    });
}

/**
 * Sends a list of all registered users to the IRC_ADMIN_NICK
 */
function userList() {
    client.say(IRC_ADMIN_NICK, users.join(', '));
}

/**
 * Admins can remove users from the list
 * @param from
 * @param to
 * @param params
 * @returns {Promise.<void>}
 */
async function userKick(from, to, params) {
    let userToRemove = params.shift().trim();
    let notifyUser = parseInt(params.shift() || 0);

    let result = {
        success: false,
        message: 'No user specified'
    };
    if (userToRemove) {
        result = await removeUser(userToRemove);
    }
    client.say(from, result.message);
    if (result.success && notifyUser) {
        client.say(userToRemove, `You have been removed from the ${BOT_NAME} by the admin`);
    }
}
/**
 * A normal user can leave the bot
 *
 * @param from
 * @param to
 * @param params Optional
 */
async function userLeave(from, to, params) {
    let result = await removeUser(from);
    client.say(from, result.message || `You have been removed from the ${BOT_NAME}`);
}

/**
 * Admin can invite users
 * @param from
 * @param to
 * @param params
 */
async function userInvite(from, to, params) {
    let userToJoin = params.shift().trim();
    let notifyUser = parseInt(params.shift() || 0);

    let result = {
        success: false,
        message: 'No user specified'
    };
    if (userToJoin) {
        result = await addUser(userToJoin);
    }
    client.say(from, result.message);
    if (result.success && notifyUser) {
        client.say(userToJoin, `You have been added to the ${BOT_NAME} by the admin`);
    }
}

/**
 * Let a normal user join the bot
 * @param from
 * @param to
 * @param params
 */
async function userJoin(from, to, params) {
    let result = await  addUser(from);
    client.say(from, result.message || `You have been added to the ${BOT_NAME}`);
}

/**
 * Removes a user from the users list
 * @param userToRemove
 * @returns {{success: boolean, message: string}}
 */
async function removeUser(userToRemove) {

    let userIndex = users.indexOf(userToRemove);
    if (userIndex === -1 || !userToRemove) {
        return {
            success: false,
            message: `${userToRemove} does not exist`
        };
    }
    users.splice(userIndex, 1);

    try {
        await storeUsers(users);
    }catch(e) {
        return {
            success: false,
            message: e
        };
    }
    return {
        success: true,
        message: ''
    };

}

/**
 * Adds a user to the users list
 * @param userToJoin
 * @returns {{success: boolean, message: string}}
 */
async function addUser(userToJoin) {

    let userIndex = users.indexOf(userToJoin);
    if (userIndex > -1 || !userToJoin) {
        return {
            success: false,
            message: `${userToJoin} has already joined`
        };
    }
    users.push(userToJoin);

    try {
        await storeUsers(users);
    }catch(e) {
        return {
            success: false,
            message: e
        };
    }
    return {
        success: true,
        message: ''
    };

}

/**
 * Writes the users array to USERS_FILE
 * @param users
 * @returns {Promise}
 */
async function storeUsers(users) {
    return new Promise((resolve, reject) => {
        fs.writeFile(USER_FILE_PATH, JSON.stringify(users), function (err) {
            if (err) {
                console.error(err);
                return reject(err);
            }

            resolve();
        });
    });


}

/**
 * Adds a question to the list of questions
 * @param from
 * @param to
 * @param params
 */
function addQuestion(from, to, params) {
    let question = params.join(' ');
    storeQuestion(question);
}

/**
 * Stores the list of questions in the QUESTIONS_FILE and updates the questions array
 * @param question
 * @returns {boolean}
 */
function storeQuestion(question) {
    if (question.trim() === '') {
        return false;
    }

    questions.push(question);

    fs.writeFile(QUESTION_FILE_PATH, JSON.stringify(questions), function (err) {
        if (err) {
            console.error(err);
        }
        client.say(IRC_ADMIN_NICK, JSON.stringify(questions));
    });
}

/**
 * Stores the user's answers in the ANSWERS_FILE
 * @param user
 */
function storeAnswer(user) {
    let storeData = Object.assign({}, responses[user]);
    fs.appendFile(ANSWER_FILE_PATH, JSON.stringify(storeData) + "\n", function (err) {
        if (err) {
            console.error(err);
        }
    });
}

/**
 * Reads the questions from QUESTIONS_FILE
 */
function readQuestions() {
    return readJsonFile(QUESTION_FILE_PATH, [])
}

/**
 * Reads the users from USERS_FILES
 */
function readUsers() {
    return readJsonFile(USER_FILE_PATH, []);
}

/**
 * Reads a file filePath and converts it to JSON
 * If the file doesn't exist it is created with defaultResult
 * If the file is empty defaultResult is returned
 * @param filePath
 * @param defaultResult
 * @returns {*}
 */
function readJsonFile(filePath, defaultResult) {
    try {
        if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, JSON.stringify(defaultResult));
        }
        let content = fs.readFileSync(filePath, {
            encoding: 'utf8'
        });
        if (content) {
            return JSON.parse(content);
        }
        return defaultResult;
    } catch (e) {
        return defaultResult;
    }
}