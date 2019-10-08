# Third party imports
from flask import Flask, Response, jsonify

# Local imports
from web import config, database, unsplash

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
	return jsonify(**photo)


@app.route('/image/refresh')
def refresh_image() -> Response:
	keywords = [
		'landscape', 'water', 'aerial', 'places',
		'city', 'sunset', 'flowers', 'snow',
		'temple', 'mountain', 'wanderlust'
	]
	photo = unsplash.get_random(keywords)
	store_image(photo)
	return jsonify()


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


def store_image(photo: dict) -> None:
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
			photo['id'],
			photo['location']['latitude'],
			photo['location']['longitude'],
			photo['location']['name'],
			photo['author']['name'],
			photo['author']['instagram'],
			photo['urls']['full']
		)
	)


if __name__ == '__main__':
	app.run()
