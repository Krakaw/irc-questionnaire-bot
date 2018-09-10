const Datastore = require('nedb');
const Questionnaire = require('./models/questionnaire');
const DEBUG = process.env.DEBUG || false;

module.exports = class Database {
    constructor(dbPath) {
        this.questionnaireDb = this._createDatabase(`${dbPath}.questionnaire.nedb`, [
            {
                fieldName: 'name',
                unique: true,
            }
        ]);
        this.questionnaire = new Questionnaire(this.questionnaireDb);
    }

    _createDatabase(datastoreParams, indexes = []) {
        if (typeof datastoreParams === 'string') {
            datastoreParams = {
                filename: datastoreParams,
            }
        }
        datastoreParams = {
            ...{
                filename: '',
                autoload: true,
                timestampData: true,
                onload(err) {
                    if (DEBUG) {
                        console.log(`${datastoreParams.filename} is ready`);
                    }
                }
            },
            ...datastoreParams
        };
        let db = new Datastore(datastoreParams);

        if (indexes.length) {
            indexes.forEach(index => {
                let indexParams = {
                    ...{
                        fieldName: '',
                        unique: false,
                        onload(err) {
                            if (err) {
                                console.error('Error creting index', err);
                            }
                        }
                    },
                    ...index
                };

                db.ensureIndex(indexParams, indexParams.onload);
            })
        }
        return db;

    }
}