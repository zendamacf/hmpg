# Third party imports
from flask import Flask, Response, jsonify

# Local imports
from web import config, unsplash

app = Flask(__name__)

app.secret_key = config.SECRETKEY


@app.route('/ping')
def ping():
	return jsonify(ping='pong')


@app.route('/image/refresh')
def refresh_image() -> Response:
	keywords = [
		'landscape', 'water', 'aerial', 'places',
		'city', 'sunset', 'flowers', 'snow',
		'temple'
	]
	photo = unsplash.random(keywords)
	return jsonify(**photo)


if __name__ == '__main__':
	app.run()
