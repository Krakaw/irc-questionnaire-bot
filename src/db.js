const Datastore = require('nedb');
const Questionnaire = require('./models/questionnaire');

module.exports = function (dbPath) {
    this.questionnaireDb = new Datastore({
        filename: dbPath + 'questionnaire.nedb', autoload: true, timestampData: true, onload: (err) => {
            console.log('DB Ready');
        }
    });
    this.questionnaireDb.ensureIndex({fieldName: 'name', unique: true}, (err) => {
        if (err) {

            console.error("Error creating nedb", err);
        }
    });

    this.questionnaire = new Questionnaire(this.questionnaireDb);
};