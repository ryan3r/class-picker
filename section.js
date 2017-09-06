const MeetingTime = require("./meeting-time");

module.exports = class {
	constructor(raw) {
		// copy over properties
		Object.assign(this, raw);
	}

	static from(raw) {
		// instantiate the times
		raw.times = raw.times.map(time => new MeetingTime(time));

		return new module.exports(raw);
	}

	// check if any of our times conflict with any of the other times
	conflictsWith(other) {
		return this.times.find(time => {
			return other.times.find(otherTime => {
				return time.conflictsWith(otherTime);
			});
		});
	}

	// get the score for this section
	getScore() {
		// get the score from the times
		let score = this.times.reduce((score, time) => time.getScore() + score, 0);

		// Tusday at 3 is ignite cs
		if(this.days & 2 > 0 && this.start <= 3 && this.end >= 3) {
			score -= 5;
		}

		return score;
	}

	// check if this section is available
	isAvailable(seatCount) {
		return this.getSeats(seatCount) > 0;
	}

	// get the number of seats available
	getSeats(seatCount) {
		return seatCount ? seatCount[this.uid] : this.seats;
	}
};
