const {downloadSchedule, downloadSeats} = require("./download");
const generate = require("./generator");
const startServer = require("./web-app");

const SCHEDULE = [
	["COM S", "228"],
	["S E", "185"],
	["PHYS", "221"],
	["MATH", "166"]
];

// generate the schedule
if(process.argv[2] == "generate") {
	process.stdout.write("Downloading...");

	// download the course info
	downloadSchedule(SCHEDULE)

	// generate the schedules
	.then(courses => generate(courses));
}
// evaluate the schedule
else {
	process.stdout.write("Downloading...");

	// download the available seats for the schedule
	Promise.all([
		downloadSeats(SCHEDULE),
		downloadSchedule(SCHEDULE)
	])

	// load and sort the schedules
	.then(seats => {
		startServer(...seats);
	});
}

// handle errors
process.on("unhandledRejection", err => {
	process.stderr.write(err.stack);
	process.exit(8);
});
