# Standard library imports
import json
import random

# Third party imports
import requests

# Local imports
from web import config


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


def _format_image(raw: dict) -> dict:
	return {
		'id': raw['id'],
		'urls': {
			'full': raw['urls']['full'],
			'regular': raw['urls']['regular']
		},
		'author': {
			'name': '{} {}'.format(raw['user']['first_name'], raw['user']['last_name']),
			'instagram': raw['user']['instagram_username']
		},
		'location': {
			'name': raw['location']['name'],
			'latitude': raw['location']['position']['latitude'],
			'longitude': raw['location']['position']['longitude']
		},
	}


def get_random(tags: list) -> dict:
	params = {
		'query': random.choice(tags),
		'orientation': 'landscape',
		'count': 30
	}
	resp = _send_request(
		'/photos/random',
		params
	)
	for r in resp:
		if r['location']['position']['latitude']:
			return _format_image(r)

	raise UnsplashException('No images found with coordinates.')
