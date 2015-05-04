# dropbox-clone

This is a basic Dropbox clone to sync files across multiple remote folders.

Time spent: ~20 hrs

# Getting Started

- Install `NodeJS` if not already installed. See http://nodejs.org/
- Install `babel`: `npm install -g babel`
- Install `nodemon`: `npm install -g nodemon`
- Clone the repo: `git@github.com:niki4810/dropbox-clone.git`
- run `npm install`

# Starting your server

From the root directory of your project you can run one of the three commands to start the server

- using start script: `npm start`
- using nodemon & babel-node: `nodemon --exec babel-node -- --stage 1 --optional strict -- index.js`
- or if you have bodemon alias setup: `bodemon index.js`

# Starting your client
From the root directory of your project run
- using nodemon & babel-node: `nodemon --exec babel-node -- --stage 1 --optional strict -- client.js`
- or if you have bodemon alias setup: `bodemon client.js`

# Features
- Start the server using the above mentioned steps, and form a different terminal

## Client can make GET requests to get file or directory contents
- To get list of files and directories, run

```
	curl -v http://127.0.0.1:8000/ -X GET
```

- To read the index.js file, run

```
	curl -v http://127.0.0.1:8000/index.js -X GET
```

## Client can make HEAD request to get just the GET headers
- To get the HEAD response, run

```
	curl -v http://127.0.0.1:8000/ --head
```

## Client can make PUT requests to create new directories and files with content
- To create a directory and a file with in it, run

```
	curl -v http://127.0.0.1:8000/foo/bar.js -X PUT -d "HelloWrold"
```
- To create just a directory, run

```
	curl -v http://127.0.0.1:8000/foo/baz/ -X PUT
```

## Client can make POST requests to update the contents of a file
- To re-write contents of an existing file, run

```
	curl -v http://127.0.0.1:8000/foo/bar.js -X POST -d "Some changed content"
```

## Client can make DELETE requests to delete files and folders

- To delete a file within a folder, run

```	
	curl -v http://127.0.0.1:8000/foo/bar.js -X DELETE
```
- To delete a folder itself, run

```
	curl -v http://127.0.0.1:8000/foo/ -X DELETE
```
## Server will serve from --dir or cwd as root
- Instead of serving files from `cwd` you can pass in a `--dir` argument when starting server to GET, PUT, POST, and DELETE from the specified `--dir` path.
- To start your server using `--dir` path run

```
	nodemon --exec babel-node -- --stage 1 --optional strict -- index.js --dir
```
- PUT a file in the `--dir` path : `curl -v http://127.0.0.1:8000/foo/bar.js -X PUT -d "HelloWrold"`
- GET a file in the `--dir` path : `curl -v http://127.0.0.1:8000/foo/bar.js -X GET`
- POST to a file in the `--dir` path:  `curl -v http://127.0.0.1:8000/foo/bar.js -X POST -d "asdfasdfa123"`
- DELETE a file in the `--dir` path: `curl -v http://127.0.0.1:8000/foo/bar.js -X DELETE`



## Client will sync from server over TCP to cwd or CLI dir argument (mainly PUT, POST, and DELETE requests)
- Start the server using one of the steps mentioned above
- Start the client using one of the steps mentioned above
- All client files are synced to the `client-files` directory under root of this project if a `--dir` argument is not passed when starting the server.

- PUT a file to the server : `curl -v http://127.0.0.1:8000/foo/bar.js -X PUT -d "HelloWrold"`
- POST to a file on the server:  `curl -v http://127.0.0.1:8000/foo/bar.js -X POST -d "asdfasdfa123"`
- DELETE a file from the server: `curl -v http://127.0.0.1:8000/foo/bar.js -X DELETE`

- You can also specify a `--dir` path to sync files to that folder when starting both client and server, see below


