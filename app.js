const env = require('./.env.json')
const http = require('http')
const ghwebhook = require('github-webhook-handler')

let handler = ghwebhook(env.git)
http.createServer((res, req) => {
	handler(req, res, (err) => {
		console.log(err)
		res.statusCode = 404
		res.end('File Not Found')
	})
}).listen(env.port)