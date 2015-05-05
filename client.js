let nssocket = require('nssocket')
let fs = require('fs')
let path = require('path')
let rimraf = require('rimraf')
let mkdirp = require('mkdirp')
let argv = require('yargs').argv

// augment songbird
require('songbird')

let dirName = argv.dir || path.join(process.cwd(), 'client-files')


// const TCP_HOST = '127.0.0.1'
const TCP_PORT = 6785
const ROOT_DIR = path.resolve(dirName)
const TCP_EVENT_MAP = {
 'create': 'SERVER-CREATE',
 'update': 'SERVER-UPDATE',
 'remove' : 'SERVER-DELETE',
 'ack': 'CLIENT-ACK'
}

let tcpClient = new nssocket.NsSocket({
	reconnect: true
})

// Sync PUT request
tcpClient.data([TCP_EVENT_MAP.create], (payload) =>{	
	writeDataToFile(payload).catch(e => console.log);
})

// Sync POST request
tcpClient.data([TCP_EVENT_MAP.update], (payload) => {
	writeDataToFile(payload).catch(e => console.log);
})

// SYNC DELETE request
tcpClient.data([TCP_EVENT_MAP.remove], (payload) => {
	async () => {	
		logSocketReq(payload);
		let filePath = path.resolve(path.join(ROOT_DIR, payload.path))
		
		if(payload.type === 'dir'){
			await rimraf.promise(filePath)
		} else await fs.promise.unlink(filePath)			

		sendSuccessAck(payload.action)
	}().catch(e => console.log)
})

tcpClient.connect(TCP_PORT);

function getDirPath(filePath, type) {	
	let endsWithSlash = filePath.charAt(filePath.length-1) === path.sep
	let hasExt = path.extname(filePath) !== ''
	let isDir = type === 'dir' ?  true : false
	let dirPath = isDir ? filePath : path.dirname(filePath)
	return dirPath;
}

function logSocketReq(payload) {
	console.log(payload);
}

function sendSuccessAck(actionType) {
	// send a message back to server
	tcpClient.send([TCP_EVENT_MAP.ack], {'message': `${actionType} action success`})
}

async function writeDataToFile (payload) {
	logSocketReq(payload);
	let filePath = path.resolve(path.join(ROOT_DIR, payload.path))
	if(payload.action === 'create') {
		let dirPath = getDirPath(filePath, payload.type)
		// create the directory path first
		await mkdirp.promise(dirPath)
	} else if(payload.action === 'update') {
		// turncate existing file
		await fs.promise.truncate(filePath, 0)	
	}
	
	if(payload.type === 'file' && payload.contents !== null) {
		console.log(payload.contents);
		//write payload.contents to that filePath
		await fs.promise.writeFile(filePath, payload.contents);
	}
	sendSuccessAck(payload.action)
}	
