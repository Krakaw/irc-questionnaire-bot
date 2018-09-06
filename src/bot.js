require('dotenv').config();
const Database = require('./db');
const IrcClient =   require('./irc-client');

const DEBUG = process.env.DEBUG || false;

const NEDB_FILE_PATH = process.env.NEDB_FILE || 'db';

const db = new Database(NEDB_FILE_PATH);

//
// db.questionnaire.addQuestion('Question?', 'q1').then(result => {
//     console.log(result);
// }).catch(e => {
//     console.error('Error', e);
// });
// db.questionnaire.findByNick({nick: 'bob', isModerator: false},null,  'vvt9r4NMMhVfqlet').then(result => {
//     console.log(result);
// }).catch(e => {
//     console.error('Error', e);
// });
// db.questionnaire.createPendingEntry('Krakaw', 'vvt9r4NMMhVfqlet').then(result => {
//     console.log(result);
// }).catch(e => {
//     console.error('Error', e);
// });
// db.questionnaire.addAnswerToPendingEntry('Krakaw', "answer!", true).then(result => {
//     console.log(result);
// }).catch(e => {
//     console.error('Error', e);
// });



// db.questionnaire.get('vvt9r4NMMhVfqlet').then(result => {
//     console.log(result);
// }).catch(e => {
//     console.error('Error', e);
// });
// return;



//
const ircClient = new IrcClient(db);
ircClient.create().connect(0, () => {
    // ircClient._onMessage('Krakaw', 'bn-test-bot', '!daily-dev-bot start_all q1');
});




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