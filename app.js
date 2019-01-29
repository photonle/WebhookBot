const env = require('./.env.json')
const http = require('https')
const fs = require('fs')
const ghwebhook = require('github-webhook-handler')

let handler = ghwebhook(env.git)

const opts = {
	key: fs.readFileSync(env.https.key),
	cert: fs.readFileSync(env.https.cert)
};

http.createServer(opts, (res, req) => {
	handler(req, res, (err) => {
		console.log(err)
		res.statusCode = 404
		res.end('File Not Found')
	})
}).listen(env.port)

handler.on('error', (err) => console.log(err))
handler.on('push', (evt) => console.log(evt))