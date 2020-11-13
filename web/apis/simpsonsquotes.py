# Standard library imports
import json

# Third party imports
import requests


class FishbulbException(Exception):
	pass


def _send_request(endpoint: str) -> dict:
	resp = requests.get(
		f'https://thesimpsonsquoteapi.glitch.me/{endpoint}'
	)
	resp.raise_for_status()
	return json.loads(resp.text)


def _format(raw: dict) -> dict:
	return {
		'content': raw['quote'],
		'author_name': raw['character']
	}


def get_random():
	resp = _send_request('quotes')[0]

	return _format(resp)
