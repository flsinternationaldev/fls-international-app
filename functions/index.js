const express = require('express'),
	path = require('path'),
	jsonfile = require('jsonfile'),
	bodyParser = require('body-parser'),
	nodemailer = require('nodemailer'),
	smtpTransport = require('nodemailer-smtp-transport'),
// TODO: Figure out if there's a way to only get the 'auto' function
	async = require('async'),
	engines = require('consolidate');

// Bring in env variables from Firebase
const functions = require('firebase-functions');
const e = require('express');

const app = express();

// Enable the ability to read env files
require('dotenv').config();

app.use(bodyParser.urlencoded({ extended: true}));

app.engine('hbs', engines.handlebars);
app.set('views', './views');
app.set('view engine', 'hbs');

app.use(express.static(path.join(__dirname, 'assets')));

// Variables to hold on to very simple state
// TODO: May need to rethink this, eventually
let globals = {
	numTestQuestions: null,
	userData: null
}

app.get('/', (req, res) => {
	res.set('Cache-Control', 'public, max-age=300, s-maxage=600');

	return async.auto({
		countriesJson: cb => {
			jsonfile.readFile(path.join(__dirname, 'assets/js/countries.json'), (err, obj) => { // eslint-disable-line
				if (err) {
					console.log('error retrieving countries json', err);
					return cb(err);
				}
		
				cb(null, obj);
			});
		},
		testJson: cb => {
			jsonfile.readFile(path.join(__dirname, 'assets/js/proficiency-test.json'), (err, obj) => { // eslint-disable-line
				if (err) {
					console.log('error retrieving proficiency-test json', err);
					return cb(err);
				}
		
				cb(null, obj);
			});
		}
	}, (err, results) => {
		if (err) console.log('something went wrong reading the JSONs', err);

		globals.numTestQuestions = results.testJson.length;

		const pageProperties = {
			title: 'FLS International Proficiency Test',
			countries: results.countriesJson || null,
			ptQuestions: results.testJson || null,
			numTestQuestions: globals.numTestQuestions,
			// TODO: Investigate a better method for importing partials
			partials: {
				preArrivalTest: path.join(__dirname, 'assets/partials/preArrivalTest'),
				proficiencyTest: path.join(__dirname, 'assets/partials/proficiencyTest'),
				completed: path.join(__dirname, 'assets/partials/completed'),
				loader: path.join(__dirname, 'assets/partials/loader'),
				scripts: path.join(__dirname, 'assets/partials/scripts')
			}
		};
	
		return res.render('index', pageProperties)
	});
});

app.post('/pre-arrival-test', (req, res) => {
	// TODO: Needs some server side validation
	globals.userData = req.body;

	res.status(200).json({ msg: 'successfully submitted pre-arrival test responses', payload: req.body });
});

app.post('/grade-test', (req, res) => {
	// TODO: Implement caching for JSON files
	return jsonfile.readFile(path.join(__dirname, 'assets/js/proficiency-test-answers.json'), (err, testAnswers) => {
		if (err) {
			console.log('error retrieving proficiency-test-answers json', err);
			return res.status(400).send( { err });
		}

		const testResponseData = req.body;

		console.log('testResponeData length & type', testResponseData.length, typeof testResponseData);
		console.log('globals.numTestQuestions length & type', globals.numTestQuestions, typeof globals.numTestQuestions);
		if (testResponseData.length !== globals.numTestQuestions) return res.status(400).send({ err: 'Please answer all test questions' });
	
		// TODO: Should really include logic that ensures the correct test questions are being compared to the correct answers
		const gradeTest = (testResponseData, testAnswers) => {
			let numCorrect = 0;

			for (let i = 0; i < testResponseData.length; i++) {
				if (testResponseData[i].selectedOptionId == testAnswers[i].correctOptionId) numCorrect++; // eslint-disable-line
			}

			return numCorrect;
		}

		const generateHtml = (userData) => {
			let html = '<h2>Pre Arrival User Info</h2>';

			for (const prop in userData) {
				html += `<p><strong>${prop}: </strong>${userData[prop]}</p>`;
			}

			return html;
		};
		// TODO: This very obviously needs to be extracted, likely into another file
		// TODO: This also needs to send an email to the email provided in the pre arrival test
		const emailTestResults = async () => {
			const transporter = nodemailer.createTransport(smtpTransport({
				// TODO: Host & Post should also be ENV variables
				name: 'hostgator',
				host: 'gator3209.hostgator.com',
				port: 465,
				// TODO: Does this need to be true?
				secure: true,
				auth: {
					user: functions.config().email.username,
					pass: functions.config().email.password
				}
			}));

			// TODO: You're getting tired, Gabriel.
			const generateHtml = (userData) => {
				let html = '<h2>Pre Arrival User Info</h2>';

				for (const prop in userData) {
					html += `<p><strong>${prop}: </strong>${userData[prop]}</p>`;
				}

				return html;
			};

			const testResults = gradeTest(testResponseData, testAnswers);

			let level;
			let rank;

			// TODO: Ensure this is done elegantly
			if (testResults >= 0 && testResults <= 7) {
				level = '1-2';
				rank = 'beginner';
			} else if (testResults >= 8 && testResults <= 14) {
				level = '3-4';
				rank = 'beginner';
			} else if (testResults >= 15 && testResults <= 21) {
				level = '5-6';
				rank = 'beginner';
			} else if (testResults >= 22 && testResults <= 27) {
				level = '7-8';
				rank = 'intermediate';
			} else if (testResults >= 28 && testResults <= 33) {
				level = '9-10';
				rank = 'intermediate';
			} else if (testResults >= 33 && testResults <= 40) {
				// TODO: Is it intentional that this 33 overlaps the previous rank?
				level = '11 - 12';
				rank = 'intermediate';
			} else if (testResults >= 41 && testResults <= 45) {
				level = '13-14';
				rank = 'advanced';
			} else if (testResults >= 46 && testResults <= 50) {
				level = '15-16';
				rank = 'advanced';
			}

			const emailHtml = `${generateHtml(globals.userData)}<h2>Proficiency Test Results</h2><p><strong>Correct responses:</strong> ${testResults}/${globals.numTestQuestions}</p><p><strong>Level:</strong> ${level}</p><p><strong>Proficiency level:</strong> ${rank}</p>`;

			console.log(`email html: ${emailHtml}`)

			return transporter.sendMail({
				// TODO: Host & port should also be env variables
				from: 'FLS International',
				to: 'akingdebased@gmail.com',
				subject: 'Test Results',
				// TODO: This, rather obviously, needs finessing
				html: emailHtml
			}, (error, info) => {
				console.log('email error', error);
				console.log('email okay?', info);
			});
		}

		return emailTestResults()
		.then(emailResults => {
			console.log('email Results?', emailResults);
			// console.log(`email has been sent with messageID ${emailResults.messageId}`);
			// TODO: Likely needs more in depth handling here
			return res.status(200).json({ msg: 'successfully graded test', gradedTest: gradeTest(testResponseData, testAnswers) });
		})
		.catch(err => {
			console.log('error sending email', err)
			return res.status(400).json({ err: err});
		});
	});
});

exports.app = functions.https.onRequest(app);