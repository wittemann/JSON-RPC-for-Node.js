/**
 * JOSN-RPC 1.0 implementation running on Node.js
 * 
 * Ther service file to includ must be given on the command line.
 * Example: node JSON-RPC/RPC.js ./service
 * 
 * http://json-rpc.org/wiki/specification
 * http://groups.google.com/group/json-rpc/web/json-rpc-1-2-proposal
 * http://groups.google.com/group/json-rpc/web/json-rpc-over-http
 * 
 * http://nodejs.org/
 * 
 * Creator: Martin Wittemann
 */

// set the version of the JSON-RPC
var version = process.ARGV[3] || "2.0";

// require the system stuff 
var sys = require('sys'), 
   http = require('http');
   
// include the service file
var serviceFile = process.ARGV[2];
if (!serviceFile) {
  sys.puts("No file for the service is given.");
  return;
} else if (serviceFile.charAt(0) != ".") {
  sys.puts("Filepath does not start with a . ");  
  return;  
} else if (serviceFile.indexOf(".js") != -1) {
  sys.puts("Please omit .js");  
  return;  
}
var service = require(serviceFile);


// create the server
http.createServer(function (req, res) {
    
  // handle GET requests
  if (req.method === "GET" && req.uri.params.method) {
    try {
      var rpcRequest = {
        method: req.uri.params.method,
        params: JSON.parse(req.uri.params.params),
        id: req.uri.params.id
      };
      processRequest(rpcRequest, res);      
    } catch (e) {
      var error = parseError();
      send(res, error.response, error.httpCode);
    }
    
  // handle POST requests
  } else {
    req.setBodyEncoding("utf8");
    var body = "";
    req.addListener("body", function(chunk) {
      body += chunk;
    });

    req.addListener("complete", function() {
      try {
        var rpcRequest = JSON.parse(body);
        processRequest(rpcRequest, res);        
      } catch (e) {
        var error = parseError();
        send(res, error.response, error.httpCode);        
      }
    });    
  } 
}).listen(8000);
sys.puts('Server running at http://127.0.0.1:8000/');


var processRequest = function(rpcRequest, res) {
  // validate
  var error = checkValidRequest(rpcRequest)
  if (error) {
    send(res, error.response, error.httpCode);
  };
  
  // named parameter handling
  if (
    version == "2.0" && 
    rpcRequest.params instanceof Object &&
    !(rpcRequest.params instanceof Array)
  ) {
    rpcRequest.params = paramsObjToArr(rpcRequest);
  }
  
  try {
    // check for param count
    if (service[rpcRequest.method].length != rpcRequest.params.length) {
      var error = invalidParams(rpcRequest);
      send(res, error.response, error.httpCode);      
      return;
    }
    
    var result = service[rpcRequest.method].apply(service, rpcRequest.params);
    
    // check for async requests
    if (result instanceof process.Promise) {
      // not failed
      result.addCallback(function(result) {
        var rpcRespone = createResponse(result, null, rpcRequest);
        send(res, rpcRespone, rpcRequest.id != null ? 200 : 204);
      });
      // failed
      result.addErrback(function(e) {    
        var error = internalError(rpcRequest);
        send(res, error.response, error.httpCode);        
      });
      return;
    // sync requests
    } else {
      var rpcRespone = createResponse(result, null, rpcRequest);
      send(res, rpcRespone, rpcRequest.id != null ? 200 : 204);
    }
  } catch (e) {
    var error = methodNotFound(rpcRequest);
    send(res, error.response, error.httpCode);    
    return;
  }
}


var send = function(res, rpcRespone, httpCode) {
  // default resposes
  if (httpCode != 204) {
    res.sendHeader(httpCode, {'Content-Type': 'application/json-rpc'});
    res.sendBody(JSON.stringify(rpcRespone));    
  // notification response
  } else {
    res.sendHeader(204, {'Connection': 'close'});    
  }
  res.finish();
}


var createResponse = function(result, error, rpcRequest) {
  if (version === "2.0") {
    var rpcResponse = {
      jsonrpc: "2.0"
    };
    error != null ? rpcResponse.error = error : rpcResponse.result = result
    rpcResponse.id = rpcRequest && rpcRequest.id ? rpcRequest.id : null;
    return rpcResponse;
  } else {
    return {
      result : result || null,
      error : error || null,
      id : rpcRequest && rpcRequest.id ? rpcRequest.id : null 
    };    
  }
}


var checkValidRequest = function(rpcRequest) {
  if (
    !rpcRequest.method || 
    !rpcRequest.params || 
    rpcRequest.id === undefined
  ) {    
    return invalidRequest(rpcRequest);
  }
  var params = rpcRequest.params;
  if (version == "2.0") {
    if (params instanceof Array || params instanceof Object) {
      return;
    }
  } else {
    if (params instanceof Array) {
      return;
    }
  }
  return invalidRequest(rpcRequest);
}



/**
 * Named arguments handling
 */

var paramsObjToArr = function(rpcRequest) {
  var argumentsArray = [];
  var argumentNames = getArgumentNames(service[rpcRequest.method]);
  for (var i=0; i < argumentNames.length; i++) {
    argumentsArray.push(rpcRequest.params[argumentNames[i]]);
  }
  return argumentsArray;
}

var getArgumentNames = function(fcn) {
  var code = fcn.toString();
  var args = code.slice(0, code.indexOf(")")).split(/\(|\s*,\s*/);
  args.shift();
  return args;
}



/**
 * ERROR HANDLING
 */
var createError = function(code, message) {
  return {code : code, message : message};
}

var parseError = function() {
  return {httpCode: 500, response: 
    createResponse(null, createError(-32700, "Parse error."), null)};
}

var invalidRequest = function(request) {
  return {httpCode: 400, response: 
    createResponse(null, createError(-32600, "Invalid Request."), request)};
}

var methodNotFound = function(request) {
  return {httpCode: 404, response: 
    createResponse(null, createError(-32601, "Method not found."), request)};  
}

var invalidParams = function(request) {
  return {httpCode: 500, response: 
    createResponse(null, createError(-32602, "Invalid params."), request)};
}

var internalError = function(request) {
  return {httpCode: 500, response: 
    createResponse(null, createError(-32603, "Internal error."), request)};  
}