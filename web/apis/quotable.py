# Standard library imports
import json

# Third party imports
import requests


class QuotableException(Exception):
	pass


def _send_request(endpoint: str) -> dict:
	resp = requests.get(
		'https://api.quotable.io{}'.format(endpoint)
	)
	resp.raise_for_status()
	return json.loads(resp.text)


def _format(raw: dict) -> dict:
	return {
		'id': raw['_id'],
		'content': raw['content'],
		'author_name': raw['author']
	}


def get_random():
	resp = _send_request('/random')

	return _format(resp)
