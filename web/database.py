# Standard library imports
import sqlite3
import os

# Third party imports
from flask import g

DATABASE = 'hmpg.db'


class DatabaseException(Exception):
	pass


class NoDatabaseFound(DatabaseException):
	pass


class QueryError(DatabaseException):
	pass


def _dict_factory(cursor, row):
	return dict(
		(cursor.description[index][0], value)
		for index, value
		in enumerate(row)
	)


def _connect() -> sqlite3.Connection:
	db = getattr(g, '_database', None)
	if db is None:
		if os.path.isfile(DATABASE):
			db = g._database = sqlite3.connect(DATABASE)
		else:
			raise NoDatabaseFound
	db.row_factory = _dict_factory
	return db


def close() -> None:
	db = getattr(g, '_database', None)
	if db is not None:
		db.close()


def query(qry: str, qargs: tuple = None) -> list:
	conn = _connect()
	cursor = conn.cursor()
	try:
		cursor.execute(
			qry,
			qargs or ()
		)
		conn.commit()
		resp = cursor.fetchall()
	except sqlite3.DatabaseError as e:
		conn.rollback()
		raise QueryError from e
	cursor.close()
	return resp
