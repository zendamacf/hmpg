CREATE TABLE image (id integer primary key, unsplashid text unique, latitude numeric, longitude numeric, location text, author_name text, author_instagram text, url text);
CREATE TABLE quote (id integer primary key, quotableid text unique, content text, author_name text);
