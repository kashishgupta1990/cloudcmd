/* RESTful module */

(function() {
    'use strict';
    
    if (!global.cloudcmd)
        return console.log(
             '# rest.js'                                        + '\n'  +
             '# -----------'                                    + '\n'  +
             '# Module is part of Cloud Commander,'             + '\n'  +
             '# used for work with REST API.'                   + '\n'  +
             '# If you wont to see at work set rest: true'      + '\n'  +
             '# and apiURL in config.json'                      + '\n'  +
             '# http://cloudcmd.io'                             + '\n');
    
    var main        = global.cloudcmd.main,
        
        DIR         = './',
        DIR_LIB     = DIR + '../',
        DIR_ROOT    = __dirname + '/' + DIR_LIB + '../',
        DIR_JSON    = DIR_ROOT + 'json/',
        
        fs          = require('fs'),
        path        = require('path'),
        crypto      = require('crypto'),
        
        Util        = require(DIR_LIB + 'util'),
        CloudFunc   = require(DIR_LIB + 'cloudfunc'),
        format      = require(DIR_LIB + 'format'),
        
        Fs          = [
            'get',
            'put',
            'delete'
        ].map(function(name) {
            return require(DIR + 'rest/fs/' + name);
        }),
        
        markdown    = require(DIR + 'rest/markdown'),
        
        auth        = require(DIR + 'auth'),
        flop        = require(DIR + 'flop'),
        pack        = require(DIR + 'pack'),
        mellow      = require(DIR + 'mellow'),
        ponse       = require(DIR + 'ponse'),
        pipe        = require(DIR + 'pipe'),
        
        isWin32     = process.platform === 'win32';
        
        
    /**
     * rest interface
     *
     * @param request
     * @param response
     * @param callback
     */
    module.exports = function(request, response, next) {
        var apiURL, name, is, regExp,
            params  = {
                request     : request,
                response    : response,
            };
        
        Util.checkArgs(arguments, ['request', 'response', 'next']);
        
        apiURL  = CloudFunc.apiURL;
        name    = ponse.getPathName(request);
        regExp  = new RegExp('^' + apiURL),
        is      = regExp.test(name);
        
        if (!is) {
            next();
        } else {
            params.name = Util.rmStrOnce(name, apiURL) || '/';
            
            sendData(params, function(error, options, data) {
                params.gzip = !error;
                
                if (!data) {
                    data    = options;
                    options = {};
                }
                
                if (options.name)
                    params.name = options.name;
                
                if (options.gzip !== undefined)
                    params.gzip = options.gzip;
                
                if (options.query)
                    params.query = options.query;
                
                if (error)
                    ponse.sendError(error, params);
                else
                    ponse.send(data, params, options.notLog);
            });
        }
    };
    
    /**
     * getting data on method and command
     * 
     * @param params {name, method, body, requrest, response}
     */
    function sendData(params, callback) {
        var p       = params,
            isFS    = Util.isContainStrAtBegin(p.name, CloudFunc.FS),
            isMD    = Util.isContainStrAtBegin(p.name, '/markdown');
        
        if (isFS)
            onFS(params, callback);
        else if (isMD)
            markdown(p.name, p.request, function(error, data) {
                callback(error, {notLog: true}, data);
            });
        else {
            switch(p.request.method) {
            case 'GET':
                onGET(params, callback);
                break;
                
            case 'PUT':
                pipe.getBody(p.request, function(error, body) {
                    if (error)
                        callback(error);
                    else
                        onPUT(p.name, body, callback);
                });
                break;
            }
        }
    }
    
    function onFS(params, callback) {
        var path,
            p               = params,
            query           = ponse.getQuery(p.request),
            optionsDefauls  = {
                gzip: false, 
                name:'.txt'
            };
            
        p.name  = Util.rmStrOnce(p.name, CloudFunc.FS) || '/';
        path    = mellow.convertPath(p.name);
        
        switch (p.request.method) {
        case 'PUT':
            Fs.put(query, path, p.request, function(error, data) {
                callback(error, optionsDefauls, data);
            });
            break;
        
        case 'GET':
            Fs.get(query, path, function(error, data) {
                var str, 
                    options = {},
                    isFile  = error && error.code === 'ENOTDIR',
                    isStr   = Util.isString(data),
                    params  = {
                        gzip: true,
                        name: path,
                        request: p.request,
                        response: p.response,
                    };
                
                if (isFile) {
                    fs.realpath(path, function(error, path) {
                        if (!error)
                            params.name = path;
                        
                        params.gzip = false;
                        ponse.sendFile(params);
                    });
                } else {
                    if (!error) {
                        data.path   = format.addSlashToEnd(p.name);
                        
                        options     = {
                            name    : p.name + '.json',
                            query   : query,
                            notLog  : true
                        };
                        
                        if (isStr)
                            str = data;
                        else
                            str = Util.stringifyJSON(data);
                    }
                    
                    callback(error, options, str);
                }
            });
            break;
        
        case 'DELETE':
            pipe.getBody(p.request, function(error, body) {
                var files;
                
                if (error)
                    callback(error);
                else {
                    files   = Util.parseJSON(body);
                    
                    Fs.delete(query, path, files, function(error) {
                        var names, msg;
                        
                        if (!error) {
                            if (files && files.length)
                                names = files;
                            else
                                names = p.name;
                            
                            msg = formatMsg('delete', names);
                        }
                        
                        callback(error, optionsDefauls, msg);
                    });
                }
            });
            break;
        }
    }
    
    /**
     * process data on GET request
     * 
     * @param pParams {method, body, requrest, response}
     */
    function onGET(params, callback) {
        var cmd, json,
            p = params;
        
        if (p.name[0] === '/')
            cmd = p.name.replace('/', '');
        
        switch(cmd) {
        case '':
            p.data = Util.stringifyJSON({
                info: 'Cloud Commander API v1'
            });
            
            callback(null, {name: 'api.json'}, p.data);
            break;
        
        case 'config':
            ponse.sendFile({
                name    : DIR_JSON + 'config.json',
                request : p.request,
                response: p.response,
                cache   : false
            });
            break;
        
        default:
            json = {
                message: 'Error: command not found!'
            };
            
            callback(json);
            break;
        }
    }
    
    /**
     * process data on PUT request
     * 
     * @param pParams {command, method, body, requrest, response}
     */
    function onPUT(name, body, callback) {
        var cmd, files, json, config, data, from, to, error;
        
        Util.checkArgs(arguments, ['name', 'body', 'callback']);
        
        if (name[0] === '/')
            cmd = name.replace('/', '');
        
        files   = Util.parseJSON(body);
        
        switch(cmd) {
        case 'auth':
            auth(body, function(error, token) {
                callback(error, Util.stringifyJSON({
                    data: token
                }));
            });
            break;
        
        case 'mv':
            if (!files.from || !files.to) {
                callback(body);
            
            } else if (isRootWin32(files.to)) {
                error = getWin32RootMsg('to');
                callback(error);
            
            } else if (isRootWin32(files.from)) {
                error = getWin32RootMsg('from');
                callback(error);
            
            } else {
                files.from  = mellow.convertPath(files.from);
                files.to    = mellow.convertPath(files.to);
                
                if (files.names)
                    data    = Util.slice(files.names);
                else
                    data    = files;
                    
                copyFiles(files, flop.move, function(error) {
                    var msg = formatMsg('move', data);
                    
                    callback(error, msg);
                });
            }
            
            break;
        
        case 'cp':
            if (!files.from || !files.names || !files.to) {
                callback(body);
            
            } else if (isRootWin32(files.to)) {
                error = getWin32RootMsg('to');
                callback(error);
            
            } else if (isRootWin32(files.from)) {
                error = getWin32RootMsg('from');
                callback(error);
            } else {
                files.from  = mellow.convertPath(files.from);
                files.to    = mellow.convertPath(files.to);
                
                files.namesAll    = Util.slice(files.names);
                copyFiles(files, flop.copy, function(error) {
                    var msg = formatMsg('copy', files.namesAll);
                    
                    callback(error, msg);
                });
            }
            break;
        
        case 'zip':
            if (!files.from) {
                callback(body);
            } else {
                from    = mellow.convertPath(files.from);
                
                if (files.to)
                    to  = mellow.convertPath(files.to);
                else
                    to  = from + '.zip';
                
                pack.gzip(from, to, function(error) {
                    var name    = path.basename(files.from),
                        msg     = formatMsg('zip', name);
                    
                    callback(error, msg);
                });
            }
            break;
        
        case 'unzip':
            if (!files.from) {
                callback(body);
            } else {
                from        = mellow.convertPath(files.from);
                
                if (files.to)
                    to      = mellow.convertPath(files.to);
                else
                    to      = Util.rmStrOnce(files.from, ['.zip', '.tar.gz', '.gz']);
                
              pack.gunzip(from, to, function(error) {
                    var name    = path.basename(files.from),
                        data    = formatMsg('unzip', name);
                    
                    callback(error, data);
                });
            }
                
            break;
        
        case 'config':
            var passwd  = files && files.password,
                sha     = crypto.createHash('sha1');
                config  = main.config;
            
            if (passwd) {
                sha.update(passwd);
                passwd          = sha.digest('hex');
                files.password = passwd;
            }
            
            Object.keys(files).forEach(function(name) {
                config[name] = files[name];
            });
            
            json = Util.stringifyJSON(config) + '\n';
            
            fs.writeFile(DIR_JSON + 'config.json', json, function(error) {
                data = formatMsg('config', name);
                callback(error, data);
            });
            
            break;
        
        default:
            callback();
            break;
        }
    }
    
    function copyFiles(files, processFunc, callback) {
        var names           = files.names,
            
            copy            = function() {
                var isLast, name,
                    from    = files.from,
                    to      = files.to;
                
                if (names) {
                    isLast  = !names.length,
                    name    = names.shift(),
                    from    += name;
                    to      += name;
                } else {
                    isLast  = false;
                    names   = [];
                }
                
                if (isLast)
                    callback();
                else
                    processFunc(from, to, function(error) {
                        if (error)
                            callback(error);
                        else
                            copy();
                    });
            };
        
        Util.checkArgs(arguments, ['files', 'processFunc', 'callback']);
        
        copy();
    }
    
    function isRootWin32(path) {
        var isRoot      = path === '/';
        
        return isWin32 && isRoot; 
    }
    
    function getWin32RootMsg(direction) {
        var messageRaw  = 'Could not copy {{ direction }} root on windows!',
            message     = Util.render(messageRaw, {
                direction: direction
            }),
            error       = Error(message);
        
        return error;
    }
    
    function formatMsg(msgParam, dataParam, status) {
        var msg, data,
            isObj = Util.isObject(dataParam);
        
        if (isObj)
            data = Util.stringifyJSON(dataParam);
        else
            data = dataParam;
            
        msg = CloudFunc.formatMsg(msgParam, data, status);
        
        return msg;
    }
    
})();
