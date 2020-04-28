# Third party imports
from flask import (
	Flask, Response, jsonify, render_template, redirect, url_for
)
import sentry_sdk
from sentry_sdk.integrations.flask import FlaskIntegration

# Local imports
from web import config, database
from web.apis import unsplash, fishbulb

if not hasattr(config, 'TESTMODE'):
	print('ENABLINGSENTRY', config.SENTRY_DSN)
	sentry_sdk.init(
		dsn=config.SENTRY_DSN,
		integrations=[
			FlaskIntegration(),
		]
	)

app = Flask(__name__)

app.secret_key = config.SECRETKEY


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
