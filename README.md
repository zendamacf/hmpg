# hmpg

[![Build Status](https://travis-ci.com/zachdlang/hmpg.svg?branch=master)](https://travis-ci.com/zachdlang/hmpg)

## Service Setup
1. Copy the service files, so Gunicorn can be automatically started & reloaded.
	
	```
	cp <Location>/collector/gu-app.service /etc/systemd/system/gu-collector.service
	```

1. Activate the service file, enable it at boot/resart, and start the app.

	```
	systemctl daemon-reload
	systemctl enable gu-collector
	systemctl start gu-collector
	```