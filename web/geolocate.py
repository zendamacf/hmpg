# Third party imports
from geopy.geocoders import Nominatim


def _format(addr: dict) -> str:
	locality = None
	if addr.get('city'):
		locality = addr['city']
	elif addr.get('state'):
		locality = addr['state']
	elif addr.get('town'):
		locality = addr['town']
	elif addr.get('village'):
		locality = addr['village']
	else:
		print(addr)
		raise Exception('Invalid Address!')
	s = '{}, {}'.format(locality, addr['country'])
	return s


def locate(latitude: str, longitude: str) -> str:
	geolocator = Nominatim(user_agent='hmpg', timeout=3)
	location = geolocator.reverse('{}, {}'.format(latitude, longitude))
	return _format(location.raw['address'])
