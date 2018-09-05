const irc = require('irc');
const COMMANDS = require('./irc-commands');
const DEBUG = process.env.DEBUG || false;

const IRC_SERVER = process.env.IRC_SERVER;
const IRC_NICK = process.env.IRC_NICK;
const IRC_PASS = process.env.IRC_PASS;
const IRC_ADMIN_NICK = process.env.IRC_ADMIN_NICK;

const BOT_NAME = process.env.BOT_NAME || 'Questionnaire Bot';
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





if (DEBUG) {
    console.log(`Connecting to ${IRC_SERVER} as ${IRC_NICK} with${IRC_PASS ? ' password' : 'out a password'}`);
    console.log(`Taking commands from ${IRC_ADMIN_NICK} `);
}

if (!IRC_SERVER || !IRC_NICK || !IRC_ADMIN_NICK) {
    console.error('Missing IRC_SERVER or IRC_NICK or IRC_ADMIN_NICK');
    process.exit(1);
}

class IrcClient {
    constructor(db) {
        this.db = db;
        this.COMMANDS = COMMANDS;
        this.commandInitializer = COMMAND_INITIALIZER;
        this.botName = BOT_NAME;
        this.ircAdminNick = IRC_ADMIN_NICK;
        this.client = false;
    }

    create(server, nick, options) {
        server = server || IRC_SERVER;
        nick = nick || IRC_NICK;
        options = {
            ...{
                userName: nick,
                password: IRC_PASS,
                realName: BOT_NAME,
                debug: false,
                sasl: true,
                autoConnect: false
            },
            ...options
        };
        this.client = new irc.Client(server, nick, options);
        this.client.addListener('message', this._onMessage.bind(this));
        this.client.addListener('error', this._onError.bind(this));
        this._bindCommands();
        return this;
    }
    connect(retryCount, cb) {
        retryCount = retryCount || 0;
        cb = cb || function() {
            console.log('Connected');
        };
        this.client.connect(retryCount, cb)
    }


    processCommands(from, to, messageString) {
        //We must execute a command
        let commandParts = messageString.split(' ');
        //Remove the command initializer
        commandParts.splice(0, 1);
        if (commandParts.length === 0) {
            //No commands added
            this.client.say(from, 'Invalid command');
            this.COMMANDS[COMMAND_HELP].func(from);
            return;
        }

        const command = commandParts.shift();
        const params = commandParts;

        if (DEBUG) {
            console.log('Command received:', command, params);
        }
        //Check if the command exists.
        if (!COMMANDS.hasOwnProperty(command)) {
            this.client.say(from, 'Invalid command');
            this.COMMANDS[COMMAND_HELP].func(from);
            return;
        }

        //Check if only admins can run it
        const commandIsAdmin = COMMANDS[command].adminOnly;
        if (commandIsAdmin && from !== IRC_ADMIN_NICK) {
            this.client.say(from, 'You do not have permission to run that command');
            return;
        }

        //Run the command
        COMMANDS[command].func(from, to, COMMANDS[command].hasParams ? params : null);
    }


    _bindCommands() {
        for(let i in this.COMMANDS) {
            if (typeof this.COMMANDS[i].func === 'function') {
                this.COMMANDS[i].func = this.COMMANDS[i].func.bind(this);
            }
        }
    }

    _onMessage(from, to, message) {
        message = message.trim();
        //Check if the command initializer has been said
        if (message[0] === '!' && message.substr(0, COMMAND_INITIALIZER.length) === COMMAND_INITIALIZER) {
            this.processCommands(from, to, message);
        }
        // else if (
        //     to === IRC_NICK &&
        //     users.indexOf(from) > -1 &&
        //     responses.hasOwnProperty(from)) {
        //     //Is it a direct message and the from user is in our list of users and we are expecting a response
        //     //This is a message to the bot from someone in our user list
        //     addAnswer(from, message);
        // }
    }

    _onError(message) {
        console.log('error: ', message);
        if (message.command === 'err_nosuchnick') {
            const user = message.args[1];
            console.log(`${user} not online at ${new Date()}`);
            try {
                //@TODO Remove pending responses
                // delete responses[user];
            } catch (e) {

            }
        }
    }


}

module.exports = IrcClient;