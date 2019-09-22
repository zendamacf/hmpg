# Standard library imports
from random import randint

# Third party imports
import requests
from bs4 import BeautifulSoup

# Local imports
from web import config, geolocate


def _send_request(method: str, params: str) -> BeautifulSoup:
	params['api_key'] = config.FLICKR_API_KEY
	params['method'] = method
	resp = requests.get(
		'https://www.flickr.com/services/rest/',
		params=params
	).content
	soup = BeautifulSoup(resp, 'xml')
	return soup


def _exif_lookup(photoid: str, key: str) -> None:
	soup = _send_request('flickr.photos.getExif', {'photo_id': photoid})

	for child in soup.find_all('exif'):
		if child['label'] == key:
			return child.find('raw').text


def _best_size(photoid: str) -> str:
	soup = _send_request('flickr.photos.getSizes', {'photo_id': photoid})

	largest = {'source': None, 'width': 0}
	for child in soup.find_all('size'):
		if int(child['height']) > int(child['width']):
			return None  # Ignore portrait orientation
		if child['label'] == 'Original':
			continue
		if int(child['width']) > int(largest['width']):
			largest = child
	return largest['source']


def search(tags: list) -> dict:
	params = {
		'tags': ','.join(tags),
		'content_type': 1,  # Photos
		'has_geo': 1,
		'geo_context': 2,  # Outdoors
		'extras': 'geo',
		'sort': 'interesting',
		'per_page': 100,
		'page': randint(1, 100)
	}
	soup = _send_request('flickr.photos.search', params)

	photos = soup.find_all('photo')
	print(len(photos))
	for i in range(0, len(photos)):
		p = photos[randint(i, len(photos))]
		url = _best_size(p['id'])
		if url is not None:
			camera = _exif_lookup(p['id'], 'Model')
			if camera is not None:
				break
	location = geolocate.locate(p['latitude'], p['longitude'])
	return {
		'url': url,
		'location': location,
		'camera': camera
	}
