# Standard library imports
import json

# Third party imports
import requests


class FishbulbException(Exception):
	pass


def _send_request() -> dict:
	resp = requests.get(
		'https://fishbulb.kalopsia.dev/'
	)
	resp.raise_for_status()
	return json.loads(resp.text)


def _format(raw: dict) -> dict:
	return {
		'category': raw['category'],
		'content': raw['content'],
		'author_name': raw['author_name']
	}


def get_random():
	resp = _send_request()

	return _format(resp)
