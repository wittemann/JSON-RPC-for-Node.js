var sys = require('sys'), 
   rpc = require('./lib/jsonrpc');
rpc.service = require("./JSON-RPC/service");

rpc.createServer().listen(8000);
sys.puts('Server running at http://127.0.0.1:8000/');