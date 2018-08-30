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


const COMMAND_INITIALIZER = process.env.COMMAND_INITIALIZER || '!q-bot';

const COMMAND_HELP = process.env.COMMAND_HELP || 'help';
const COMMAND_JOIN = process.env.COMMAND_JOIN || 'join';
const COMMAND_LEAVE = process.env.COMMAND_LEAVE || 'leave';
const ADMIN_COMMAND_INVITE = process.env.ADMIN_COMMAND_INVITE || 'invite';
const ADMIN_COMMAND_KICK = process.env.ADMIN_COMMAND_KICK || 'kick';
const ADMIN_COMMAND_START = process.env.ADMIN_COMMAND_START || 'start';
const ADMIN_COMMAND_ADD_QUESTION = process.env.ADMIN_COMMAND_ADD_QUESTION || 'add-question';

const COMMANDS = {
    [COMMAND_HELP]: {
        adminOnly: false,
        hasParams: false,
        func: showHelp
    },
    [COMMAND_JOIN]: {
        adminOnly: false,
        hasParams: false,
        func: userJoin
    },
    [COMMAND_LEAVE]: {
        adminOnly: false,
        hasParams: false,
        func: userLeave
    },
    [ADMIN_COMMAND_INVITE]: {
        adminOnly: true,
        hasParams: 'nick',
        func: userJoin
    },
    [ADMIN_COMMAND_KICK]: {
        adminOnly: true,
        hasParams: 'nick',
        func: userLeave
    },
    [ADMIN_COMMAND_START]: {
        adminOnly: true,
        hasParams: 'nick (optional)',
        func: startQuestions
    },
    [ADMIN_COMMAND_ADD_QUESTION]: {
        adminOnly: true,
        hasParams: 'question',
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
const responses = {};

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

    //Check if the command initializer has been said
    if (message[0] === '!' && message.substr(0, COMMAND_INITIALIZER.length) === COMMAND_INITIALIZER) {
        processCommands(from, to, message);
    } else if (
        to === IRC_NICK
        && users.indexOf(from) > -1
        && responses.hasOwnProperty(from)) {
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

function showHelp(user) {
    let helpMessage = `${BOT_NAME} is a questionnaire bot, it will PM you a set of questions and broadcast your answers back to ${IRC_PUBLIC_CHANNEL}\n`;
    const isAdmin = user === IRC_ADMIN_NICK;
    for (let commandText in COMMANDS) {
        let command = COMMANDS[commandText];
        if (!command.adminOnly) {
            helpMessage += `${COMMAND_INITIALIZER} ${commandText} ${command.hasParams || ''}\n`;
        } else if (command.adminOnly && isAdmin) {
            helpMessage += `${COMMAND_INITIALIZER} ${commandText} ${command.hasParams || ''}\n`;
        }
    }
    client.say(user, helpMessage);
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


function startQuestions(from, to, params) {

    let usersToPoll = users;
    if (params.length > 0) {
        usersToPoll = params;
    }

    usersToPoll.forEach(user => {
        startQuestionsForUser(user);
    });
}

function startQuestionsForUser(user) {
    responses[user] = {};
    askQuestion(user, questions[0])
}

function askQuestion(user, question) {
    responses[user][question] = false;
    client.say(user, question);
}

function addAnswer(user, answer) {
    for (let i in questions) {
        let question = questions[i];
        if (!responses[user].hasOwnProperty(question)) {
            continue;
        }
        let hasNextQuestion = i < questions.length - 1;
        if (responses[user][question] === false) {
            responses[user][question] = answer;
            if (hasNextQuestion) {
                askQuestion(user, questions[parseInt(i) + 1]);
                return;
            } else {
                if (FINAL_MESSAGE) {
                    client.say(user, FINAL_MESSAGE);
                }
                console.log(`${new Date()} - Storing ${user} answers`);
                postToChannel(user);
                storeAnswer(user);
            }
        }
    }
}


function postToChannel(user) {
    client.say(IRC_PUBLIC_CHANNEL, RESULTS_START_MESSAGE.replace(/{user}/g, user));
    questions.forEach(question => {
        client.say(IRC_PUBLIC_CHANNEL, question);
        client.say(IRC_PUBLIC_CHANNEL, `> ${responses[user][question]}`);
    });
}


function userLeave(from, to, params) {
    let userToLeave = from;
    if (params) {
        userToLeave = params.shift().trim();
    }
    let userIndex = users.indexOf(userToLeave);
    if (userIndex === -1 || !userToLeave) {
        client.say(from, `${userToLeave} does not exist`);
        return;
    }

    users.splice(userIndex, 1);

    storeUsers(users, (err) => {
        if (err) {
            client.say(from, 'There was an error storing the user');
        } else {
            let addressee = 'You have';
            if (from !== userToLeave) {
                addressee = userToLeave + ' has';
            }
            client.say(from, `${addressee} been removed from ${BOT_NAME}`);
        }
    });
}


function userJoin(from, to, params) {
    let userToJoin = from;
    if (params) {
        userToJoin = params.shift().trim();
    }
    let userIndex = users.indexOf(userToJoin);
    if (userIndex > -1 || !userToJoin) {
        client.say(from, `${userToJoin} has already joined`);
        return;
    }
    users.push(userToJoin);
    storeUsers(users, (err) => {
        if (err) {
            client.say(from, 'There was an error storing the user');
        } else {
            let addressee = 'You have';
            if (from !== userToJoin) {
                addressee = userToJoin + ' has';
            }
            client.say(from, `${addressee} been added to ${BOT_NAME}`);
        }
    });

}

function storeUsers(users, cb) {
    fs.writeFile(USER_FILE_PATH, JSON.stringify(users), function (err) {
        if (err) {
            console.error(err);
        }
        if (cb) {
            cb(err);
        }
    });
}


function addQuestion(from, to, params) {
    let question = params.join(' ');
    storeQuestion(question);
}

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

function storeAnswer(user) {
    let storeData = Object.assign({}, responses[user]);
    storeData.date = new Date();
    storeData.user = user;
    fs.appendFile(ANSWER_FILE_PATH, JSON.stringify(storeData) + "\n", function (err) {
        if (err) {
            console.error(err);
        }
    });
}

function readQuestions() {
    return readJsonFile(QUESTION_FILE_PATH, [])
}

function readUsers() {
    return readJsonFile(USER_FILE_PATH, []);
}

function readJsonFile(filePath, defaultResult) {
    try {
        if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, JSON.stringify(defaultResult));
        }
        let content = fs.readFileSync(filePath, {encoding: 'utf8'});
        if (content) {
            return JSON.parse(content);
        }
        return defaultResult;
    } catch (e) {
        return defaultResult;
    }
}