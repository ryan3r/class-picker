const request = require("request");
const Section = require("./section");
const MeetingTime = require("./meeting-time");

// load the defaults
let defaults;

function fetchDefaults() {
	defaults = new Promise((resolve, reject) => {
		request("http://classes.iastate.edu/app/rest/formdefaults", function(err, res, body) {
			// pass on the error
			if(err) reject(err);
			else resolve(JSON.parse(body));
		});
	});
}

// Download the class info
function downloadCourse({department, course, justSeats}) {
	if(!defaults) {
		fetchDefaults();
	}

	return defaults.then(defaults => {
		return new Promise((resolve, reject) => {
			// initialize the query with the defaults
			let query = Object.assign({}, defaults);

			// set the semester
			query.defSem = 1;
			query.selectedTerm = 1;

			// set the class info
			query.selectedDepartment = department;
			query.courseNumber = course;

			// get the actual class info
			request({
				method: "POST",
				url: "http://classes.iastate.edu/app/rest/courses/preferences",
				headers: {
					"content-type": "application/json; charset=UTF-8"
				},
				body: JSON.stringify(query)
			}, function(err, res, body) {
				// pass on any errors
				if(err) return reject(err);

				try {
					// parse the request body
					let rawInfo = JSON.parse(body).response[0];

					// get just the seat data
					if(justSeats) {
						resolve(processSeats(rawInfo));
					}
					// process the class info
					else {
						resolve(processInfo(rawInfo));
					}
				}
				// catch any json errors
				catch(err) {
					reject(err);
				}
			});
		});
	});
}

// get the info we need in the format we want
function processInfo(rawInfo) {
	// grab the info we care about
	let info = {
		uid: `${rawInfo.deptCode.replace(/\s+/g, "")}-${rawInfo.classNumber}`,
		name: `${rawInfo.deptCode} ${rawInfo.classNumber}`,
		hasLab: false,
		sections: [],
		labSections: []
	};

	for(let rawSection of rawInfo.sections) {
		// process the section
		let section = new Section({
			// the unique id for this section
			uid: `${info.uid}-${rawSection.sectionID.trim()}`,
			// the id for this section
			id: rawSection.sectionID.trim(),
			// the refrence number for access plus
			refNum: rawSection.referenceNumber,
			// the seats available for this section
			seats: rawSection.openseats,
			// the meeting times for this section
			times: rawSection.sectionTimes.map(time => new MeetingTime({
				// get the start and stop times
				start: (time.startTime[0] * 60) + time.startTime[1],
				end: (time.stopTime[0] * 60) + time.stopTime[1],

				// the type of course (eg. lecture, lab...)
				type: time.instructionType,

				// the formatted start and end times
				prettyStart: time.formattedStartTime,
				prettyEnd: time.formattedStopTime,

				// convert the single letter days into a number
				days: time.meetDays.split("").reduce((days, day) => {
					// not a day
					if(day == " ") return days;

					let dayNum;
					// pick the code for this day
					if(day == "M") dayNum = 1;
					if(day == "T") dayNum = 2;
					if(day == "W") dayNum = 4;
					if(day == "R") dayNum = 8;
					if(day == "F") dayNum = 16;

					// add this day in
					return days | dayNum;
				}, 0)
			}))
		});

		// check if this section is a lab
		section.isLab = !section.times.find(time => time.type == "LEC");

		// add the section to the proper list
		if(section.isLab) {
			info.hasLab = true;

			info.labSections.push(section);
		}
		else {
			info.sections.push(section);
		}
	}

	return info;
}

// collect just the seats
function processSeats(rawInfo) {
	let seats = {};

	// get the id for this course
	const courseId = `${rawInfo.deptCode.replace(/\s+/g, "")}-${rawInfo.classNumber}`;

	// get the ids for the sections
	for(let section of rawInfo.sections) {
		seats[`${courseId}-${section.sectionID.trim()}`] = section.openseats;
	}

	return seats;
}

// download a schedule
exports.downloadSchedule = function(schedule) {
	return Promise.all(
		schedule.map(schedule => {
			// download the course
			return downloadCourse({
				department: schedule[0],
				course: schedule[1]
			});
		})
	);
};

// download just the seats
exports.downloadSeats = function(schedule) {
	return Promise.all(
		schedule.map(schedule => {
			// download the course
			return downloadCourse({
				department: schedule[0],
				course: schedule[1],
				justSeats: true
			})
		})
	)

	.then(schedule => {
		// combine the seats
		return Object.assign({}, ...schedule);
	});
};
