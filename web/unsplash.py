# Standard library imports
import json

# Third party imports
import requests

# Local imports
from web import config, geolocate


class UnsplashException(Exception):
	pass


def _send_request(endpoint: str, params: dict) -> dict:
	headers = {
		'Accept-Version': 'v1',
		'Authorization': 'Client-ID {}'.format(config.UNSPLASH_ACCESS_KEY)
	}
	resp = requests.get(
		'https://api.unsplash.com{}'.format(endpoint),
		params=params,
		headers=headers
	)
	resp.raise_for_status()
	return json.loads(resp.text)


def random(tags: list) -> dict:
	params = {
		'query': 'mountain',
		'orientation': 'landscape',
		'count': 30
	}
	resp = _send_request(
		'/photos/random',
		params
	)
	for r in resp:
		latitude = r['location']['position']['latitude']
		longitude = r['location']['position']['longitude']
		if latitude and longitude:
			location = geolocate.locate(latitude, longitude)
			if location:
				return {
					'id': r['id'],
					'urls': {
						'full': r['urls']['full'],
						'regular': r['urls']['regular']
					},
					'author': {
						'name': '{} {}'.format(r['user']['first_name'], r['user']['last_name']),
						'instagram': r['user']['instagram_username']
					},
					'location': location
				}
				return r

	raise UnsplashException('No images found with coordinates.')
