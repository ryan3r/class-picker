const HOUR_SCORES = {
	0: 0,
	1: 0,
	2: 0,
	3: 0,
	4: 0,
	5: 0,
	6: 0,
	7: 1,
	8: 4,
	9: 9,
	10: 9,
	11: 9,
	12: 9,
	13: 9,
	14: 9,
	15: 9,
	16: 6,
	17: 4,
	18: 1,
	19: 1,
	20: 0,
	21: 0,
	22: 0,
	23: 0,
};

const DAY_MASKS = [
	[1, "M"],
	[2, "T"],
	[4, "W"],
	[8, "R"],
	[16, "F"]
];

module.exports = class {
	constructor(raw) {
		// copy over properties
		Object.assign(this, raw);
	}

	conflictsWith(other) {
		// no days match so there is no overlap
		if(this.days & other.days === 0) return false;

		// check if the times overlap
		return (this.start <= other.start && other.start <= this.end) ||
			(this.start <= other.end && other.end <= this.end);
	}

	getScore() {
		// caclulate the score based on the times
		let score = HOUR_SCORES[this.start / 60 | 0] + HOUR_SCORES[this.end / 60 | 0];

		// weigh the score based on how long the class lasts
		score *= (this.end - this.start) / 60;

		return score;
	}

	// get the days as a string
	getDays() {
		// convert days back to a string
		let days = "";

		for(let [mask, letter] of DAY_MASKS) {
			// add a dash if there is none
			if((this.days & mask) == 0) days += "-";
			// add the letter for this day
			else days += letter;
		}

		return days;
	}
}
