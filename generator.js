const Schedule = require("./schedule");
const fs = require("fs");

// generate the schedules and write them to the file
module.exports = function(courses) {
	// stream the schedules to a file
	let out = fs.createWriteStream("generated.json");

	// generate schedules
	let generator = generateSchedule(courses);

	// generate schedules
	function generate() {
		let done = false;
		let ok = true;

		while(ok && !done) {
			let generated = generator.next();

			done = generated.done;

			// save the schedule
			if(!done) {
				ok = out.write(JSON.stringify(generated.value));
			}
		}

		// enqueue the next 500
		if(!done) {
			out.once("drain", generate);
		}
	}

	generate();
};

function *generateSchedule(courses) {
	// get all the name, section pairs
	let pairs = getPairs(courses);

	// the total possible combinations
	let total = pairs.reduce((a, b) => a * b.sections.length, 1);
	// the number of schedules generated
	let generated = 0;

	// start the generation
	yield* generate(pairs, 0, []);

	console.log("\rGenerating schedules...done");

	// generate all possible schedules that don't conflict
	function *generate(pairs, index, schedule) {
		for(let section of pairs[index].sections) {
			// check if this course causes a conflict
			if(schedule.find(pair => pair.section.conflictsWith(section))) {
				let skipped = 1;

				// add all the sections we have skipped here
				for(let i = index + 1; i < pairs.length; ++i) {
					skipped *= pairs[i].sections.length;
				}

				generated += skipped;

				printProgress();

				continue;
			}

			// add this section
			const nextSchedule = schedule.concat({
				section,
				name:pairs[index].name
			});

			// this is the last section
			if(index == pairs.length - 1) {
				// update the progress
				++generated;

				printProgress();

				yield new Schedule(nextSchedule);
			}
			// add the rest of the sections
			else {
				yield* generate(pairs, index + 1, nextSchedule);
			}
		}
	}

	// print the progress
	function printProgress() {
		const percent = (generated / total) * 100 | 0;

		process.stdout.write(`\rGenerating schedules...${percent}%`)
	}
};

// get the section, course name pairs
function getPairs(courses) {
	let pairs = [];

	for(let course of courses) {
		// add the lecture sections
		pairs.push({
			name: course.name,
			sections: course.sections
		});

 		// add the lab section
		if(course.hasLab) {
			pairs.push({
				name: course.name + " [lab]",
				sections: course.labSections
			});
		}
	}

	return pairs;
}
