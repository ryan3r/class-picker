const express = require("express");
const processSchedules = require("./process-schedules");

module.exports = function(seats, info) {
	let schedules;

	let app = express();

	app.use("/static", express.static("static"));

	// generate the schedules
	app.get("/", (req, res) => {
		genSchedules()

		.then(() => res.redirect("/schedule/0"));
	});

	// get a schedule
	app.get("/schedule/:index", (req, res) => {
		// if we don't have the schedules get generate them
		if(!schedules) return res.redirect("/");

		// get the schedule
		let schedule = schedules[req.params.index];

		// redirect the back to the right path
		if(!schedule) {
			if(req.params.index == 0) {
				return res.end("Nothing available");
			}
			else {
				return res.redirect("/schedule/0");
			}
		}

		res.set("content-type", "text/html");

		res.write("<link rel='stylesheet' href='/static/style.css'/><table>");
		res.write(`<a href="/courses">Courses</a>`);
		res.write("<tr><th>Course</th><th>Section</th><th>Refrence</th><th>Times</th></tr>");

		// print the sections
		for(let {name, section} of schedule.pairs) {
			let times = "<table>";

			for(let time of section.times) {
				times += `<div class="pad">
					${time.prettyStart} - ${time.prettyEnd} [${time.getDays()}]
				</div>`;
			}

			times += "</table>"

			res.write(`<tr>
				<td>${name}</td>
				<td>${section.id}</td>
				<td>${section.refNum}</td>
				<td class="nopad">${times}</td>
			</tr>`);
		}

		res.write("</table>");

		// add back button
		if(req.params.index > 0) {
			res.write(`<a href="/schedule/${+req.params.index - 1}">Previous</a>`);
		}

		// add a forward button
		if(req.params.index < schedules.length - 1) {
			res.write(`<a href="/schedule/${+req.params.index + 1}" class="right">Next</a>`);
		}

		res.end();
	});

	app.get("/courses", (req, res) => {
		res.set("content-type", "text/html");

		res.write("<ul>");

		for(let i = 0; i < info.length; ++i) {
			res.write(`<li><a href="/course/${i}">${info[i].name}</a></li>`);
		}

		res.end("</ul><a href='/'>Schedules</a>");
	});

	app.get("/course/:index", (req, res) => {
		res.set("content-type", "text/html");
		const {index} = req.params;

		res.write(`<ul><form action='/set/course/${index}'>`);

		for(let i = 0; i < info[index].sections.length; ++i) {
			const section = info[index].sections[i];

			res.write(`<li><input type="checkbox" name="${section.uid}" ${seats[section.uid] > 0 ? "checked" : ""}/>${section.id}</li>`)
		}

		for(let i = 0; i < info[index].labSections.length; ++i) {
			const section = info[index].labSections[i];

			res.write(`<li><input type="checkbox" name="${section.uid}" ${seats[section.uid] > 0 ? "checked" : ""}/>${section.id}</li>`)
		}

		res.end("<button type='submit'>Save</button></form></ul><a href='/courses'>Courses</a>");
	});

	app.get("/set/course/:index", (req, res) => {
		const {index} = req.params;

		for(let i = 0; i < info[index].sections.length; ++i) {
			const section = info[index].sections[i];
			seats[section.uid] = 0;
		}

		for(let i = 0; i < info[index].labSections.length; ++i) {
			const section = info[index].labSections[i];
			seats[section.uid] = 0;
		}

		for(let key of Object.keys(req.query)) {
			seats[key] = req.query[key] == "on" ? 1 : 0;
		}

		res.redirect("/courses");
	});

	app.listen(8923, () => console.log("\rListening on port: 8923"));

	// generate the schedules
	function genSchedules() {
		return processSchedules(seats)

		// print the winning schedule
		.then(_schedules => {
			// show the best schedules first
			_schedules.sort((a, b) => a.getMinSeats(seats) - b.getMinSeats(seats));

			// make the schedules available
			schedules = _schedules;
		});
	}
};
