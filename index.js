let fs = require('fs')
let path = require('path')
let express = require('express')
let morgan = require('morgan')
let nodeify = require('bluebird-nodeify')
let mime = require('mime-types')
let rimraf = require('rimraf')
let mkdirp = require('mkdirp')
let argv = require('yargs').argv
let nssocket = require('nssocket')

// augment songbird
require('songbird')

let dirName = argv.dir || process.cwd()
const NODE_ENV = process.env.NODE_ENV || 'development'
const PORT = process.env.PORT || 8000
const TCP_PORT = 6785
const ROOT_DIR = path.resolve(dirName)
const TCP_EVENT_MAP = {
 'create': 'SERVER-CREATE',
 'update': 'SERVER-UPDATE',
 'remove' : 'SERVER-DELETE',
 'ack': 'CLIENT-ACK'
}

let app = express()

let tcpSocket;
let tcpServer = nssocket.createServer(function (socket) {   	
   	tcpSocket = socket

   	// log any acknowledgements from client to console   	
   	tcpSocket.data([TCP_EVENT_MAP.ack], function (data) { 
		console.log(data.message)
	})
}).listen(TCP_PORT);


if(NODE_ENV === 'development') {
	app.use(morgan('dev'))
}

app.listen(PORT, () => console.log(`LISTENING @ http://127.0.0.1:${PORT}`))

app.get('*', setFileMeta, sendHeaders, (req, res) => {
	if(res.body) {
		res.json(res.body)
		return	
	}
	
	fs.createReadStream(req.filePath).pipe(res)
})

app.head('*', setFileMeta, sendHeaders, (req, res) => res.end())

app.delete('*', setFileMeta, (req, res, next) => {
	async () => {
		if(!req.stat) return res.send(400, 'Invalid path')
		let isDir = req.stat.isDirectory();
		if(isDir){
			await rimraf.promise(req.filePath)
		} else await fs.promise.unlink(req.filePath)		

		// if a client exists sync the data to client
		if(tcpSocket) {			
			let payload = getTCPPayload('delete', req.url, isDir)   	
			tcpSocket.send([TCP_EVENT_MAP.remove], payload);						
		}

		res.end()
	}().catch(next)
})

app.put('*', setFileMeta, setDirDetails, (req, res, next) => {
	async () => {
		if(req.stat) return res.send(405, 'File exists')

		await mkdirp.promise(req.dirPath)

		if (!req.isDir) {
			req.pipe(fs.createWriteStream(req.filePath))
		}
		
		// if a client exists sync the data to client
		if(tcpSocket) {
			// TODO : Find if there is a better way to read the req content
			// instead of reading from file :(
			let data = await fs.promise.readFile(req.filePath, {encoding: 'base64'})
			let payload = getTCPPayload('create', req.url, req.isDir, data)   	
			tcpSocket.send([TCP_EVENT_MAP.create], payload);
		}
		res.end()
	}().catch(next)
})

app.post('*', setFileMeta, setDirDetails, (req, res, next) => {
	async () => {
		if(!req.stat) return res.send(405, 'File does not exists')
		if(req.isDir) return res.send(405, 'Path is a directory')
						 
		await fs.promise.truncate(req.filePath, 0)	
		req.pipe(fs.createWriteStream(req.filePath))		

		// if a client exists sync the data to client
		if(tcpSocket) {
			// TODO : Find if there is a better way to read the req content
			// instead of reading from file :(
			let data = await fs.promise.readFile(req.filePath, {encoding: 'base64'})
			let payload = getTCPPayload('update', req.url, req.isDir, data)   	
			tcpSocket.send([TCP_EVENT_MAP.update], payload);
		}

		res.end()
	}().catch(next)
})

function getTCPPayload(action, path, isDir, contents) {
	return	{
	    "action": action,
	    "path": path,
	    "type": isDir ? 'dir': 'file',
	    "contents": contents || null,
	    "updated": new Date().getTime()
	};
}

function setDirDetails(req, res, next) {
	let filePath = req.filePath;	
	let endsWithSlash = filePath.charAt(filePath.length-1) === path.sep
	let hasExt = path.extname(filePath) !== ''
	req.isDir = endsWithSlash || !hasExt
	req.dirPath = req.isDir ? filePath : path.dirname(filePath)
	next()
}

function setFileMeta (req, res, next) {	
	req.filePath = path.resolve(path.join(ROOT_DIR, req.url))	
	if(req.filePath.indexOf(ROOT_DIR) !== 0) {
		res.send(400, 'Invalid path')
		return
	}
	fs.promise
	.stat(req.filePath).then(stat => req.stat = stat, () => req.stat = null)
	.nodeify(next)
}

function sendHeaders (req, res, next) {
	nodeify(async () => {		
		if(req.stat.isDirectory()) {			
			let files = await fs.promise.readdir(req.filePath)			
			res.body = JSON.stringify(files)
			res.setHeader('Content-Length', res.body.length)
			res.setHeader('Content-type', 'application/json')
			return
		}		
		res.setHeader('Content-Length', req.stat.size)
		let contentType = mime.contentType(path.extname(req.filePath))
		res.setHeader('Content-type', contentType)
	}(), next)	
}
