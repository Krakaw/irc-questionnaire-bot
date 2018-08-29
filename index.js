const fs = require('fs');
require('dotenv').config();
const irc = require('irc');

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

const COMMAND_JOIN = process.env.COMMAND_JOIN;
const COMMAND_START = process.env.COMMAND_START;
const COMMAND_ADD_QUESTION = process.env.COMMAND_ADD_QUESTION;


const users = readUsers();
const questions = readQuestions();


let responses = {};

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

    //Admin only commands
    if (from === IRC_ADMIN_NICK && message[0] === '!') {
        //Get answers from all users
        if (message.indexOf(COMMAND_START) === 0) {
            let startCommands = message.split(' ');
            //There is only the command, so run it for all the users
            if (startCommands.length === 1) {
                startQuestions(users);
            } else {
                //Run it for these specific users
                startCommands.splice(0,1);
                startQuestions(startCommands);
            }
        }

        if (message.indexOf(`${COMMAND_ADD_QUESTION} `) === 0) {
            //Add a new question
            storeQuestion(message.replace(`${COMMAND_ADD_QUESTION} `, ''));
        }

    } else {
        //Public commands

        if (
            to === process.env.IRC_NICK
            && users.indexOf(from) > -1
            && responses.hasOwnProperty(from)) {
            //This is a message to the bot from someone in our user list
            addAnswer(from, message);
        } else if (message === COMMAND_JOIN) {
            //Someone has sent the join command
            addRemoveUser(from);
        }
    }


});

client.addListener('error', function (message) {
    console.log('error: ', message);
    if (message.command === 'err_nosuchnick') {
        const user = message.args[1];
        console.log(`${user} not online at ${new Date()}`);
        try {

            delete responses[user];
        }catch(e) {

        }
    }
});

client.connect(0, () => {
    console.log('Connected');
});


function startQuestions(users) {
    responses = {};
    users.forEach(user => {
        startQuestionsForUser(user);
    });
}

function startQuestionsForUser(user) {
    if (!responses.hasOwnProperty(user)) {
        responses[user] = {};
    }
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

function addRemoveUser(user) {
    let userIndex = users.indexOf(user);
    if (userIndex > -1) {
        users.splice(userIndex, 1);
    } else {
        users.push(user);
    }
    fs.writeFile(USER_FILE_PATH, JSON.stringify(users), function (err) {
        if (err) {
            console.error(err);
        }
        if (userIndex > -1) {
            client.say(user, 'You have been removed from the daily dev standup');
        } else {
            client.say(user, 'You have been added to the daily dev standup');
        }
    });
}

function storeQuestion(question) {
    questions.push(question);

    fs.writeFile(QUESTION_FILE_PATH,  JSON.stringify(questions), function (err) {
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