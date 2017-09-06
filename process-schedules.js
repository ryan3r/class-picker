const fs = require("fs");
const JSONStream = require("JSONStream");
const Schedule = require("./schedule");

module.exports = function(seats) {
	// load the schedules
	const scheduleStream = fs.createReadStream("generated.json")
		.pipe(JSONStream.parse());

	// save the highest ranking schedule
	let score = -1, highest = [];

	scheduleStream.on("data", schedule => {
		// instantiate the schedule
		schedule = Schedule.from(schedule);

		// check if this schedule is available
		if(schedule.isAvailable(seats)) {
			if(schedule.score == score) {
				highest.push(schedule);
			}
			else if(schedule.score > score) {
				score = schedule.score;
				highest = [schedule];
			}
		}
	});

	// wait until all of the schedules have been loaded
	return new Promise((resolve) => {
		scheduleStream.on("end", () => resolve(highest));
	});
}
