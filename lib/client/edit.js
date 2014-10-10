var CloudCmd, Util, DOM, CloudFunc, ace, DiffProto, diff_match_patch, Zip, MenuIO, Format;
(function(CloudCmd, Util, DOM, CloudFunc) {
    'use strict';
    
    CloudCmd.Edit = EditProto;
        
    function EditProto(callback) {
        var Name        = 'Edit',
            Loading     = true,
            DIR         = CloudCmd.LIBDIRCLIENT + 'edit/',
            LIBDIR      = CloudCmd.LIBDIR,
            Info        = DOM.CurrentInfo,
            Files       = DOM.Files,
            type        = Util.type,
            join        = CloudCmd.join,
            
            Menu,
            Value,
            Edit        = this,
            Diff,
            Emmet,
            Ace,
            Session,
            Modelist,
            Events      = DOM.Events,
            RESTful     = DOM.RESTful,
            Dialog      = DOM.Dialog,
            Images      = DOM.Images,
            Element, JSHintConfig,
            ConfigView  = {
                beforeClose: function() {
                    isChanged();
                    
                    if (Menu)
                        Menu.hide();
                },
                afterShow: function() {
                    Ace.clearSelection();
                    Ace.moveCursorTo(0, 0);
                    Ace.focus();
                }
            };
            
       function init(callback) {
            Util.exec.series([
                CloudCmd.View,
                load,
                Edit.show.bind(null, callback)
            ]);
        }
        
        this.show                       = function(callback) {
            var func    = Util.exec.ret(callback);
            
            if (!Loading) {
                Images.showLoad();
                
                if (!Element) {
                    Element         = DOM.load({
                        name        : 'div',
                        style   :
                            'width      : 100%;'    +
                            'height     : 100%;'    +
                            'font       : 16px "Droid Sans Mono";' +
                            'position   : absolute;',
                        notAppend : true
                    });
                    
                    initAce();
                    
                    Events.add(Element, {
                            contextmenu :   setMenu,
                            drop        :   onDrop,
                            dragover    :   Events.preventDefault
                        });
                }
                
                getData(function(error, data) {
                    Edit.setValue(data);
                    
                    ConfigView.beforeShow = func;
                    
                    CloudCmd.View.show(Element, ConfigView);
                });
            }
        };
        
        this.setValue                   = function(value) {
            var UndoManager = ace.require('ace/undomanager').UndoManager;
            
            Value           = value;
            
            Ace.setValue(value);
            Session.setUndoManager(new UndoManager());
        };
        
        this.hide                       = function() {
            CloudCmd.View.hide();
        };
        
        this.goToLine                   = function() {
            var msg     = 'Enter line number:',
                cursor  = Ace.selection.getCursor(),
                number  = cursor.row + 1,
                line    = Dialog.prompt(msg, number);
            
            number      = line - 0;
            
            if (number)
                Ace.gotoLine(number);
        };
        
        function getData(callback) {
            var name        = Info.name,
                isDir       = Info.isDir;
                
            Util.checkArgs(arguments, ['callback']);
            
            if (isDir)
                Edit.setMode('json');
            else
                Edit.setModeForPath(name);
            
            Info.getData(function(error, data) {
                callback(error, data);
            });
        }
        
        this.setModeForPath             = function(name) {
            var modesByName = Modelist.modesByName,
                mode        = Modelist.getModeForPath(name).mode,
            
                htmlMode    = modesByName.html.mode,
                jsMode      = modesByName.javascript.mode,
            
                isHTML      = mode === htmlMode,
                isJS        = mode === jsMode;
            
            Session.setMode(mode);
            setUseOfWorker(mode);
            setEmmet(isHTML);
            
            if (isJS && Session.getUseWorker())
                setJsHintConfig();
        };
        
        this.setMode                    = function(mode) {
            var ext,
                modesByName = Modelist.modesByName;
                
            if (modesByName[mode]) {
                ext = modesByName[mode].extensions.split('|')[0];
                Edit.setModeForPath('.' + ext);
            }
        };
        
        function isChanged() {
            var is,
                value   = Ace.getValue(),
                isEqual = value === Value,
                msg     = 'Do you want to save changes to ' + name + '?';
            
            if (!isEqual) {
                is = Dialog.confirm(msg);
                
                if (is)
                    save();
            }
        }
        
        function setEmmet(isHTML) {
            DOM.Files.get('edit', function(error, config) {
                var extensions  = config.extensions,
                    isEmmet     = extensions.emmet;
                
                if (isEmmet && isHTML)
                    Util.exec.if(Emmet, function() {
                            Ace.setOption('enableEmmet', isHTML);
                        }, function(callback) {
                            var url;
                            
                            if (!isHTML) {
                                callback();
                            } else {
                                url = join([
                                    DIR + 'emmet.js',
                                    DIR + 'ext-emmet.js'
                                ]);
                                
                                DOM.load.js(url, function() {
                                    Emmet = ace.require('ace/ext/emmet');
                                    Emmet.setCore(window.emmet);
                                    
                                    callback();
                                });
                            }
                        });
                    });
        }
        
        function setUseOfWorker(mode) {
            var isMatch,
                isStr   = type.string(mode),
                regStr  = 'coffee|css|html|javascript|json|lua|php|xquery',
                regExp  = new RegExp(regStr);
            
            if (isStr)
                isMatch = regExp.test(mode);
            
            Session.setUseWorker(isMatch);
        }
        
        function initAce() {
            Ace     = ace.edit(Element);
            Session = Ace.getSession();
            
            Ace.commands.addCommand({
                name    : 'hide',
                bindKey : { win: 'Esc',  mac: 'Esc' },
                exec    : function () {
                    Edit.hide();
                }
            });
            
            Ace.commands.addCommand({
                name    : 'goToLine',
                bindKey : { win: 'Ctrl-G',  mac: 'Command-G' },
                exec    : function () {
                    Edit.goToLine();
                }
            });
            
            Ace.commands.addCommand({
                name    : 'save',
                bindKey : { win: 'Ctrl-S',  mac: 'Command-S' },
                exec    : save
            });
            
            Ace.commands.addCommand({
                name    : 'saveMC',
                bindKey : { win: 'F2',  mac: 'F2' },
                exec    : save
            });
            
            ace.require('ace/ext/language_tools');
            Modelist = ace.require('ace/ext/modelist');
            
            Files.get('edit', function(error, config) {
                var options      = config.options;
                    
                Ace.setOptions(options);
            });
        }
        
        function save () {
            var path    = Info.path,
                value   = Ace.getValue();
            
            DOM.Files.get('config', function(error, config) {
                var isDiff      = config.diff,
                    isZip       = config.zip;
                
                Util.exec.if(!isDiff, function(patch) {
                    var query           = '',
                        MAX_SIZE        = CloudFunc.MAX_FILE_SIZE,
                        patchLength     = patch.length,
                        length          = Value.length,
                        isLessMaxLength = length < MAX_SIZE,
                        isLessLength    = isLessMaxLength && patchLength < length,
                        isStr           = type.string(patch);
                    
                    Value               = value;
                    
                    if (isStr && patch && isLessLength)
                        query           = '?patch';
                    else
                        patch           = false;
                    
                    Util.exec.if(!isZip || query, function(equal, data) {
                        var result  = data || patch || Value,
                            url     = path + query;
                        
                        RESTful.write(url, result , onSave);
                    }, function(func) {
                        zip(value, function(error, data) {
                            if (error)
                                Util.log(error);
                            
                            query = '?unzip';
                            func(null, data);
                        });
                    });
                    
                }, Util.exec.with(doDiff, path));
            });
        }
        
        function doDiff(path, callback) {
            var value = Ace.getValue();
            
            diff(value, function(patch) {
                var isAllowed = DOM.Storage.isAllowed();
                
                Util.exec.if(!isAllowed, callback, function(func) {
                        DOM.checkStorageHash(path, function(error, equal) {
                            if (!equal)
                                patch = '';
                            
                            func(patch);
                        });
                });
            });
        }
        
        function diff(newValue, callback) {
            var url = join([
                    LIBDIR + 'diff/diff-match-patch.js',
                    LIBDIR + 'diff.js'
                ]);
            
            DOM.load.js(url, function(error) {
                var patch, 
                    isAllowed   = DOM.Storage.isAllowed();
                
                if (error) {
                    Dialog.alert(error);
                } else {
                    if (!Diff)
                        Diff        = new DiffProto(diff_match_patch);
                    
                    Util.exec.if(!isAllowed, function() {
                        patch       = Diff.createPatch(Value, newValue);
                        Util.exec(callback, patch);
                    }, function(func) {
                        var path = Info.path;
                        
                        DOM.getDataFromStorage(path, function(error, data) {
                            if (data)
                                Value   = data;
                            
                            func();
                        });
                    });
                }
            });
        }
        
        function zip(value, callback) {
            var dir             = CloudCmd.LIBDIRCLIENT,
                url             = join([
                    dir + 'zip/dist/pako.js',
                    dir + 'zip.js'
                ]);
            
            DOM.load.js(url, function() {
                Zip.pack(value, callback);
            });
        }
        
        function setJsHintConfig(callback) {
            var JSHINT_PATH = CloudCmd.PREFIX + '/.jshintrc',
                func        = function() {
                    var worker  = Session.$worker;
                    
                    if (worker)
                        worker.send('changeOptions', [JSHintConfig]);
                    
                    Util.exec(callback);
                };
            
            Util.exec.if(JSHintConfig, func, function() {
                DOM.load.ajax({
                    url     :  JSHINT_PATH,
                    success : function(data) {
                        JSHintConfig = Util.json.parse(data);
                        func();
                    }
                });
            });
        }
        
        function setMenu() {
            if (!Menu) {
                DOM.loadMenu(function(error) {
                    var position    = CloudCmd.MousePosition,
                        options     = {
                            beforeShow: function(params) {
                                params.x -= 18;
                                params.y -= 27;
                            },
                            afterClick: function() {
                                Ace.focus();
                            }
                    },
                    menuData    = {
                        'Save           Ctrl+S' : save,
                        'Go To Line     Ctrl+G' : function() {
                            Edit.goToLine();
                        },
                        'Select All     Ctrl+A' : function() {
                            Ace.selectAll();
                        },
                        'Delete         Del'    : function() {
                            Ace.remove('right');
                        },
                        'Close          Esc'    : Edit.hide
                    };
                    
                    if (error) {
                        Dialog.alert(error);
                    } else if (!Menu) {
                        Menu        = new MenuIO(Element, options, menuData);
                        Menu.show(position.x, position.y);
                        
                        Events.remove('contextMenu', Element, setMenu);
                    }
                });
            }
        }
        
        function load(callback) {
            var url     = join([
                    'theme-tomorrow_night_blue',
                    'ext-language_tools',
                    'ext-searchbox',
                    'ext-modelist'
                ].map(function(name) {
                    return DIR + name + '.js';
                }));
            
            Util.time(Name + ' load');
            
            DOM.loadRemote('ace', function() {
                DOM.load.js(url, function() {
                    Loading = false;
                    
                    Util.timeEnd(Name + ' load');
                    Util.exec(callback);
                });
                
                DOM.load.style({
                    id      : 'msg-css',
                    inner   : '#js-view .msg {'     +
                                'z-index'           + ': 1;'                    +
                                'background-color'  + ': #7285B7;'              +
                                'color'             + ': #D1F1A9;'              +
                                'position'          + ': fixed;'                +
                                'left'              + ': 40%;'                  +
                                'top'               + ': 25px;'                 +
                                'padding'           + ': 5px;'                  +
                                'opacity'           + ': 0.9;'                  +
                                'transition'        + ': ease 0.5s;'            +
                            '}'
                });
            });
        }
        
        function onSave(text) {
            var ret,
                size    = Format.size(Value.length),
                isError = Util.isContainStrAtBegin(text, 'error'),
                path    = Info.path,
                msg     = '\nShould I save file anyway?';
                
            if (!isError) {
                Edit.showMessage(text);
                DOM.saveDataToStorage(path, Value);
                DOM.setCurrentSize(size);
            } else {
                ret     = Dialog.confirm(text + msg);
                
                if (ret)
                    RESTful.write(path, Value, onSave);
            }
        }
        
         function onDrop(event) {
            var reader, files,
                onLoad   =  function(event) {
                    var data    = event.target.result;
                    
                    Ace.setValue(data);
                };
            
            event.preventDefault();
            
            files   = event.dataTransfer.files;
            
            Util.forEach(files, function(file) {
                reader  = new FileReader();
                Events.addLoad(reader, onLoad);
                reader.readAsBinaryString(file);
            });
        }
        
        this.showMessage    = function(text) {
            var msg, HIDE_TIME = 2000;
            
            /* 
             * Msg should be created and removed
             * if it's not and just inner text
             * is changing, and hide and show of DOM
             * is called - bug occures: empty box
             * with no text inside.
             */
            msg = DOM.load({
                name        : 'div',
                className   : 'msg',
                parent      : Element,
                inner       : text,
                func        : alert
            });
            
            setTimeout(function() {
                DOM.remove(msg, Element);
            }, HIDE_TIME);
        };
        
        init(callback);
    }
    
})(CloudCmd, Util, DOM, CloudFunc);
