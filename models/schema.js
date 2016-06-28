var sql = require('sql');

exports.tweets = sql.define({
	name: 'tweets',
	columns: [
		{ name: 'id' },
		{ name: 'month' },
		{ name: 'day' },
		{ name: 'year' },
		{ name: 'text' },
		{ name: 'location' },
		{ name: 'lat' },
		{ name: 'long' },
    { name: 'retweet_count' },
    { name: 'fav_count' },
    { name: 'date' },
		{ name: 'query'}
	]
});
