const uri = `${process.env.DATA_DIR}users.nedb`;
const {Model, SoftDeletes} = require('nedb-models')


class User extends Model {

	static datastore() {
		return {
			filename: uri
		}
	}




}

User.defaults = () => {
	return {
		...Model.defaults(), values: {
			email: "",
			password: "",
			serviceIdentification: [
				//{service: "", name: ""}
			],
		}
	};
};
User.use(SoftDeletes);
User.ensureIndex({
	fieldName: 'email',
	unique: true,
	onload(err) {
		if (err) {
			console.error(`Error creating index`);
			console.error(err);
		}
	}
});
module.exports = User;