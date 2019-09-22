# Third party imports
from flask import Flask, Response, jsonify

# Local imports
from web import config, flickr

app = Flask(__name__)

app.secret_key = config.SECRETKEY


@app.route('/image/refresh')
def refresh_image() -> Response:
	keywords = [
		'landscape', 'water', 'aerial', 'places',
		'city', 'sunset', 'flowers', 'snow',
		'temple'
	]
	photo = flickr.search(keywords)
	return jsonify(**photo)


if __name__ == '__main__':
	app.run()