# JSON-RPC for node.js
Here you see a implementation of the JSON-RPC specification version 1.0 and 
version 2.0 (proposal).
http://json-rpc.org/wiki/specification
http://groups.google.com/group/json-rpc/web/json-rpc-1-2-proposal

## Usage
See the `modultest.js` file for an example. The `service.js` file includes the 
methods which can be called in this test scenario.

var rpc = require('./jsonrpc');
rpc.service = require("./service");
rpc.createServer().listen(8000);

The service is quite simple, for example:

this.echo = function(a) {
  return a;
}

## Manual Testing
For manual testing, use the test.html file. Currently, it only works in Safari 
because thats my browser I use for development. Don't plan to get it working in 
other browsers because after the unit test are complete, the manual testing 
is useless.

## Unit Tests
Create a symlink of the `test-jsonrpc.js` finle in the test folder of node.js 
(`test/mjsunit`) and check that the source path of the module is ok in the test 
file.

## TODO
The unit tests are by far not complete so that my next topic to complete the 
unit test (for POST and the rest of the GET requests). Additionally, requests 
for JSON-RPC 1.0 should be included.