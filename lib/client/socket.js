var CloudCmd, Util, DOM, io;

(function(CloudCmd, Util, DOM) {
    'use strict';
    
    CloudCmd.Socket = SocketProto;
        
    function SocketProto(callback) {
        var Socket              = Util.exec.bind(Util),
            AllListeners        = {},
            socket,
            log                 = Util.log.bind(Util),
            
            CONNECTED           = 'terminal: socket connected\n',
            DISCONNECTED        = 'terminal: socket disconnected\n';
        
        Socket.on               = addListener;
        Socket.addListener      = addListener;
        Socket.removeListener   = removeListener;
        Socket.send             = send;
        Socket.emit             = emit;
        
        Socket.CONNECTED        = CONNECTED;
        Socket.DISCONNECTED     = DISCONNECTED;
        
        function init(callback) {
            DOM.loadSocket(function() {
                Util.exec(callback);
                
                if (!socket)
                    connect();
            });
        }
        
        function addListener(name, func) {
           Util.addListener(name, func, AllListeners, socket);
        }
        
        function removeListener(name, func) {
            Util.removeListener(name, func, AllListeners, socket);
        }
        
        function send(data) {
            if (socket)
                socket.send(data);
        }
        
        function emit(channel, data) {
            if (socket)
                socket.emit(channel, data);
        }
        
        function setListeners(all, socket) {
            var listeners;
            
            Object.keys(all).forEach(function(name) {
                listeners   = all[name];
                
                listeners.forEach(function(func) {
                    if (func)
                        socket.on(name, func);
                });
            });
        }
        
        function connect() {
            var FIVE_SECONDS = 5000;
            
            socket = io.connect({
                'max reconnection attempts' : Math.pow(2, 32),
                'reconnection limit'        : FIVE_SECONDS
            });
            
            if (socket.connected && AllListeners.connect)
                AllListeners.connect.forEach(function(func) {
                    func();
                });
            
            socket.on('connect', function () {
                log(CONNECTED);
            });
            
            setListeners(AllListeners, socket);
            
            socket.on('disconnect', function () {
                log(DISCONNECTED);
            });
            
            socket.on('reconnect_failed', function () {
                log('Could not reconnect. Reload page.');
            });
        }
        
        init(callback);
        
        return Socket;
    }
    
})(CloudCmd, Util, DOM);
