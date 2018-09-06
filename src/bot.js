require('dotenv').config();
const Database = require('./db');
const IrcClient =   require('./irc-client');

const DEBUG = process.env.DEBUG || false;

const NEDB_FILE_PATH = process.env.NEDB_FILE || 'db';

const db = new Database(NEDB_FILE_PATH);
const ircClient = new IrcClient(db);
ircClient.create().connect();



// db.questionnaire.create({
//     name :"questionnaire 1"
// }).then(res => {
//     console.log(res);
// }).catch(e => {
//     console.log(e);
// })
// db.questionnaire.findPendingForUser("Krakaw").then (result => {
//     console.log(result);
// }).catch(e => {
//     console.error('asDasdasD',e);
// })
// db.questionnaire.addAnswerToPendingEntry("Krakaw", "MY last Other answer").then (result => {
//     console.log(result);
// }).catch(e => {
//     console.error('asDasdasD',e);
// })