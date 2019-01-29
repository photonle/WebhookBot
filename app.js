const env = require('./.env.json')
const http = require('https')
const ghwebhook = require('github-webhook-handler')

let handler = ghwebhook(env.git)
http.createServer(env.https, (res, req) => {
	handler(req, res, (err) => {
		console.log(err)
		res.statusCode = 404
		res.end('File Not Found')
	})
}).listen(env.port)

handler.on('error', (err) => console.log(err))
handler.on('push', (evt) => console.log(evt))