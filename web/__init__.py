# Third party imports
from flask import (
	Flask, Response, jsonify, render_template, redirect, url_for,
	got_request_exception, request
)
import rollbar
import rollbar.contrib.flask

# Local imports
from web import config, database
from web.apis import unsplash, fishbulb

app = Flask(__name__)

app.secret_key = config.SECRETKEY


@app.before_first_request
def init_rollbar():
	if not hasattr(config, 'TESTMODE'):
		env = 'production'
		if request.remote_addr == '127.0.0.1':
			env = 'development'
		rollbar.init(
			config.ROLLBAR_TOKEN,
			environment=env
		)

		# send exceptions from `app` to rollbar, using flask's signal system.
		got_request_exception.connect(rollbar.contrib.flask.report_exception, app)


@app.teardown_appcontext
def teardown(exception: Exception) -> Response:
	database.close()


@app.route('/ping')
def ping() -> Response:
	return jsonify(ping='pong')


@app.route('/')
def landing() -> Response:
	photo = get_image()
	quote = get_quote()
	return render_template('landing.html', photo=photo, quote=quote)


@app.route('/refresh')
def refresh() -> Response:
	refresh_image()
	return redirect(url_for('landing'))


@app.route('/refresh/image')
def refresh_image() -> Response:
	keywords = [
		'landscape', 'water', 'aerial', 'places',
		'city', 'sunset', 'flowers', 'snow',
		'temple', 'mountain', 'wanderlust'
	]
	photo = unsplash.get_random(keywords)
	store_image(photo)
	return redirect(url_for('landing'))


def get_image() -> dict:
	resp = database.query(
		"""
		SELECT
			unsplashid, latitude, longitude, location,
			author_name, author_instagram, url
		FROM image
		ORDER BY id DESC LIMIT 1
		"""
	)
	return resp[0]


def get_quote() -> dict:
	return fishbulb.get_random()


def store_image(image: dict) -> None:
	database.query(
		"""
		INSERT INTO image (
			unsplashid, latitude, longitude, location,
			author_name, author_instagram, url
		) VALUES (
			?, ?, ?, ?,
			?, ?, ?
		)
		""",
		(
			image['id'],
			image['location']['latitude'],
			image['location']['longitude'],
			image['location']['name'],
			image['author']['name'],
			image['author']['instagram'],
			image['urls']['full']
		)
	)


if __name__ == '__main__':
	app.run()
