var Util, Zip, pako;

(function () {
    'use strict';
   
    var UTF8 = new UTF8Proto();
    
    Zip      = new ZipProto();
   
   function ZipProto() {
        this.pack = function(str, callback) {
            var buf, deflate, result,
                isArrayBuffer = Util.type.arrayBuffer(str);
            
            if (isArrayBuffer)
                buf     = str;
            else
                buf     = utf8AbFromStr(str);
            
            deflate = new pako.Deflate({
                gzip:true
            });
            
            deflate.push(buf, true);
            
            if (!deflate.error)
                result = deflate.result.buffer;
            
            Util.exec(callback, deflate.error, result);
        };
        
        function utf8AbFromStr(str) {
            var i,
                strUtf8 = UTF8.unescape(encodeURIComponent(str)),
                n       = strUtf8.length,
                arr     = new Uint8Array(n);
            
            for (i = 0; i < n; i++)
                arr[i] = strUtf8.charCodeAt(i);
            
            return arr;
        }
    }
   
    function UTF8Proto() {
        /*jshint nonstandard:true */
        var isUnescape  = typeof unescape === 'function',
            func        = isUnescape ? unescape : decode;
        
        this.unescape   = func;
   }
    
    /* 
     * unescape polyfill
     * http://unixpapa.com/js/querystring.html
     */
     
    function decode(s) {
        s = s.replace(/%([EF][0-9A-F])%([89AB][0-9A-F])%([89AB][0-9A-F])/gi, ef)
             .replace(/%([CD][0-9A-F])%([89AB][0-9A-F])/gi, cd)
             .replace(/%([0-7][0-9A-F])/gi, o7);
        
        return s;
        
        function o7(code, hex) {
            return String.fromCharCode(parseInt(hex,16));
        }
            
        function ef(code, hex1, hex2, hex3) {
            var n, n3,
                n1 = parseInt(hex1,16) - 0xE0,
                n2 = parseInt(hex2,16) - 0x80;
            
            if (n1 === 0 && n2 < 32)
                return code;
            
            n3  = parseInt(hex3,16)-0x80;
            n   = (n1<<12) + (n2<<6) + n3;
            
            if (n > 0xFFFF)
                return code;
            
            return String.fromCharCode(n);
        }
        
        function cd(code, hex1, hex2) {
            var n1, n2;
            
            n1 = parseInt(hex1,16) - 0xC0;
            
            if (n1 < 2)
                return code;
            
            n2 = parseInt(hex2,16) - 0x80;
            
            return String.fromCharCode((n1<<6) + n2);
        }
    }
})();
