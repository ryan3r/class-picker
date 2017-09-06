const Section = require("./section");

const DAY_MASKS = [
	[1, "M"],
	[2, "T"],
	[4, "W"],
	[8, "R"],
	[16, "F"]
];

module.exports = class {
	constructor(pairs) {
		this.pairs = pairs;

		// calculate the schedule score
		this.score = this.pairs.reduce((score, pair) => score + pair.section.getScore(), 0);
	}

	static from(raw) {
		// instantiate the sections
		raw.forEach(pair => {
			pair.section = Section.from(pair.section);
		});

		return new module.exports(raw);
	}

	toJSON() {
		return this.pairs;
	}

	print(seatCount) {
		// print all the sections
		for(let {name, section} of this.pairs) {
			// print the section info
			console.log(`${name} (${section.id}) [${seatCount[section.uid]}] - ${section.refNum}`);

			// print the times
			for(let time of section.times) {
				// convert days back to a string
				let days = "";

				for(let [mask, letter] of DAY_MASKS) {
					// add a dash if there is none
					if((time.days & mask) == 0) days += "-";
					// add the letter for this day
					else days += letter;
				}

				// print the time
				console.log(`\t${time.prettyStart} - ${time.prettyEnd} [${days}]`);
			}

			console.log();
		}
	}

	// check if this schedule is available
	isAvailable(seatCount) {
		for(let {section} of this.pairs) {
			if(!section.isAvailable(seatCount)) return false;
		}

		return true;
	}

	// get the minimum number of seats available
	getMinSeats(seatCount) {
		return this.pairs.reduce((min, {section}) =>
			Math.min(min, section.getSeats(seatCount)), Infinity);
	}
};
