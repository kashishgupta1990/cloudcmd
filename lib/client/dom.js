var CloudCmd, Util, DOM, CloudFunc, Dialog;

(function(Util, window) {
    'use strict';
    
    var DOMFunc                     = function() {},
        DOMProto,
        
        DialogProto                 = function() {
            this.alert      = alert.bind(window);
            this.prompt     = prompt.bind(window);
            this.confirm    = confirm.bind(window);
        },
        
        ImagesProto                 = function() {
            var Images,
                ImageElementProto   = function() {
                    var LOADING         = 'loading',
                        LoadingImage,
                        HIDDEN          = 'hidden',
                        ERROR           = 'error';
                    
                    function init() {
                        var is;
                        
                        if (!LoadingImage) {
                            LoadingImage    = LOADING;
                            is              = DOM.isSVG();
                            
                            if (is)
                                LoadingImage += '-svg';
                            else
                                LoadingImage += '-gif';
                        }
                    }
                    
                    function getElement() {
                        var element;
                        
                        init();
                        
                        element = DOM.load({
                            name        : 'span',
                            id          : 'js-status-image',
                            className   : 'icon',
                            attribute   : 'data-progress',
                            notAppend   : true
                        });
                        
                        return element;
                    }
                    
                    this.get        = getElement;
                    
                    /* Функция создаёт картинку загрузки */
                    this.loading    = function() {
                        var element = getElement();
                        
                        DOM.addClass(element, LOADING)
                           .addClass(element, LoadingImage)
                           .removeClass(element, ERROR)
                           .removeClass(element, HIDDEN);
                        
                        return element;
                    };
                    
                    /* Функция создаёт картинку ошибки загрузки */
                    this.error      = function() {
                        var element = getElement();
                        
                        DOM.addClass(element, ERROR)
                           .removeClass(element, LOADING)
                           .removeClass(element, LoadingImage)
                           .removeClass(element, HIDDEN);
                          
                        return element;
                    };
            };
            
            Images = new ImageElementProto();
            /** 
             * Function shows loading spinner
             * pPosition = {top: true};
             */   
            this.showLoad = function(position) {
                var top             = position && position.top,
                    current,
                    image           = Images.loading(),
                    parent          = image.parentElement;
                
                if (top)
                    current         = DOM.getRefreshButton().parentElement;
                else {
                    current         = DOM.getCurrentFile();
                    current         = DOM.getByClass('name', current);
                }
                
                if (!parent || (parent && parent !== current))
                    current.appendChild(image);
                
                DOM.show(image);
                
                return image;
            };
            
            /**
             * hide load image
             */
            this.hide       = function() {
                var element = Images.get();
                DOM.hide(element);
            };
            
            /**
             * show error image (usualy after error on ajax request)
             */
            this.showError = function(jqXHR, isQuiet) {
                var isStr           = Util.type.string(jqXHR),
                    image           = Images.error(),
                    response        = '',
                    statusText      = '',
                    status          = 0,
                    text            = '';
                            
                if (jqXHR)
                    if (isStr) {
                        text = jqXHR;
                    } else {
                        response       = jqXHR.responseText;
                        statusText     = jqXHR.statusText;
                        status         = jqXHR.status;
                        text           = status === 404 ? response : statusText;
                    }
                
                DOM.show(image);
                image.title = text;
                
                if (text)
                    setTimeout(function() {
                        if (!isQuiet)
                            Dialog.alert(text);
                        
                        Util.log(text);
                    }, 100);
                
                return image;
            };
            
            this.setProgress    = function(value, title) {
                var DATA    = 'data-progress',
                    element = Images.get();
                    
                if (element) {
                    element.setAttribute(DATA, value + '%');
                    
                    if (title)
                        element.title = title;
                }
            };
                
            this.clearProgress  = function() {
                var DATA    = 'data-progress',
                    element = Images.get();
                    
                 if (element) {
                    element.setAttribute(DATA, '');
                    element.title = '';
                }
            };
        },
        
        DOMTreeProto                = function() {
            var DOM                     = this;
            /**
             * add class to element
             * 
             * @param element
             * @param pClass
             */
            this.addClass                = function(element, pClass) {
               var ret        = element && pClass;
                
                if (ret)
                   element.classList.add(pClass);
                
                return this;
            };
            
            /**
             * remove class pClass from element element
             * @param element
             * @param pClass
             */
            this.removeClass             = function(element, pClass) {
                var ret        = element && pClass;
                
                if (ret)
                   element.classList.remove(pClass);
                
                return this;
            };
            
            this.toggleClass             = function(element, pClass) {
                var ret        = element && pClass;
                
                if (ret)
                   element.classList.toggle(pClass);
                
                return this;
            };
            
            /**
             * check class of element
             * 
             * @param element
             * @param pClass
             */
            this.isContainClass          = function(element, pClass) {
                var ret,
                    lClassList = element && element.classList;
                    
                if (lClassList )
                    ret = lClassList.contains(pClass);
                    
                return ret;
            };
            
            /**
             * Function search element by tag
             * @param pTag - className
             * @param element - element
             */
            this.getByTag                = function(pTag, element) {
                return (element || document).getElementsByTagName(pTag);
            };
            
            /**
             * Function search element by id
             * @param Id - id
             */
            this.getById                = function(pId) {
                return document.getElementById(pId);
            };
            
            /**
             * Function search first element by class name
             * @param pClass - className
             * @param element - element
             */
            this.getByClass             = function(pClass, elementParam) {
                var element = elementParam || document,
                    ret     = this.getByClassAll(pClass, element)[0];
                
                return ret;
            };
            
            this.getByDataName          = function(attribute, element) {
                var ret,
                    selector    = '[' + 'data-name="' + attribute + '"]';
                
                if (!element)
                    element     = document;
                
                ret             = element.querySelector(selector);
                
                return ret;
            };
            
            /**
             * Function search element by class name
             * @param pClass - className
             * @param element - element
             */
            this.getByClassAll          = function(pClass, element) {
                return (element || document).getElementsByClassName(pClass);
            };
            
            /**
             * check SVG SMIL animation support
             */
            this.isSVG                  = function() {
                var ret, svgNode, name,
                    create  = document.createElementNS,
                    SVG_URL = 'http://www.w3.org/2000/svg';
                
                if (create) {
                    create  = create.bind(document);
                    svgNode = create(SVG_URL, 'animate');
                    name    = svgNode.toString();
                    ret     = /SVGAnimate/.test(name);
                }
                
                return ret;
            };
            
            /**
             * add class=hidden to element
             * 
             * @param element
             */
            this.hide                    = function(element) {
                return DOM.addClass(element, 'hidden');
            };
            
            this.show                    = function(element) {
                return DOM.removeClass(element, 'hidden');
            };
        },
        
        CmdProto                    = function() {
            var Cmd                     = this,
                CurrentInfo             = {},
                CURRENT_FILE            = 'current-file',
                SELECTED_FILE           = 'selected-file',
                SelectType              = '*.*',
                Title,
                TabPanel   = {
                    'js-left'        : null,
                    'js-right'       : null
                };
            
            /**
             * private function thet unset currentfile
             * 
             * @currentFile
             */
            function unsetCurrentFile(currentFile) {
                var ret = DOM.isCurrentFile(currentFile);
                
                if (ret)
                    DOM.removeClass(currentFile, CURRENT_FILE);
                
                return ret;
            }
            
            this.loadRemote         = function(name, callback) {
                var Files       = DOM.Files;
                
                Files.get(['config', 'modules'], function(error, config, modules) {
                    var remoteTmpls, local, remote,
                        load        = DOM.load,
                        prefix      = CloudCmd.PREFIX,
                        online      = config.online && navigator.onLine, 
                        
                        remoteObj   = Util.findObjByNameInArr(modules, 'remote'),
                        module      = Util.findObjByNameInArr(remoteObj, name),
                        
                        isArray     = Util.type.array(module.local),
                        version     = module.version,
                        
                        funcON      = function() {
                            load.parallel(remote, function(error) {
                                if (error)
                                    funcOFF();
                                else
                                    callback();
                            });
                        },
                        
                        funcOFF     = function() {
                            load.parallel(local, callback);
                        };
                        
                    if (isArray) {
                        remoteTmpls = module.remote;
                        local       = module.local;
                    } else {
                       remoteTmpls  = [module.remote];
                       local        = [module.local];
                    }
                    
                    local   = local.map(function(url) {
                        return prefix + url;
                    });
                    
                    remote  = remoteTmpls.map(function(tmpl) {
                        return Util.render(tmpl, {
                            version: version
                        });
                    });
                            
                    Util.exec.if(online, funcON, funcOFF);
                });
                
                return DOM;
            };
            
            /**
             * load jquery from google cdn or local copy
             * @param callback
             */
            this.loadJquery         = function(callback) {
                return DOM.loadRemote('jquery', callback);
            };
            
            this.loadSocket         = function(callback) {
                return DOM.loadRemote('socket', callback);
            };
            
            /** function loads css and js of Menu
             * @param callback
             */
            this.loadMenu           = function(callback) {
                return DOM.loadRemote('menu', callback);
            };
            
            this.uploadFiles        = function(files) {
                var func    = CloudCmd.refresh,
                    dir     = CurrentInfo.dirPath,
                    load    = function(file, callback) {
                        var Images  = DOM.Images,
                            name    = file.name,
                            path    = dir + name;
                            
                            Images.showLoad({top: true});
                            Images.setProgress(0, name);
                            
                            DOM.RESTful.write(path, file, callback);
                    };
                
                Util.checkArgs(arguments, ['files']);
                
                if (files.length) {
                    Util.forEach(files, function(file) {
                        func    = Util.exec.with(load, file, func);
                    });
                    
                    func();
                }
            };
            
            /**
             * create new folder
             *
             */
            this.promptNewDir        = function() {
                promptNew('directory', '?dir');
            };
            
            /**
             * create new file
             *
             * @typeName
             * @type
             */
            this.promptNewFile       = function() {
                 promptNew('file');
            };
            
            function promptNew(typeName, type) {
                var RESTful = DOM.RESTful,
                    path    = '',
                    name    = Cmd.getCurrentName(),
                    dir     = Cmd.getCurrentDirPath(),
                    msg     = 'New ' + typeName || 'File';
                
                if (name === '..')
                    name = '';
                
                name        = Dialog.prompt(msg, name);
                path        = dir + name;
                
                if (type)
                    path    += type;
                    
                if (name)
                    RESTful.write(path, function() {
                        CloudCmd.refresh(null, function() {
                            var current = DOM.getCurrentFileByName(name);
                            
                            DOM.setCurrentFile(current);
                        });
                    });
            }
            
            function twopack(current, operation) {
                var op,
                    nameDir     = '',
                    nameFile    = '',
                    RESTful     = DOM.RESTful,
                    Images      = DOM.Images,
                    name        = Cmd.getCurrentName(current),
                    dir         = Cmd.getCurrentDirPath(),
                    path        = dir + name,
                    fileFrom    = {
                        from    : path
                    };
                
                Util.checkArgs(arguments, ['operation']);
                
                if (operation.pack) {
                    op          = RESTful.zip;
                    nameDir     = name + '.tar.gz';
                    nameFile    = name + '.gz';
                } else if (operation.unpack) {
                    op          = RESTful.unzip;
                    nameDir     = Util.rmStrOnce(name, '.tar.gz');
                    nameFile    = Util.rmStrOnce(name, '.gz');
                }
                
                Images.showLoad();
                
                if (name && name !== '..')
                    op(fileFrom, function() {
                        CloudCmd.refresh(null, function() {
                            var byName  = DOM.getCurrentFileByName,
                                dir     = byName(nameDir),
                                file    = byName(nameFile);
                                
                            DOM.setCurrentFile(dir || file);
                        });
                    });
            }
            
            /**
             * zip file
             *
             */
            this.pack       = function(current) {
                twopack(current, {
                    pack: true
                });
            };
            
            /**
             * unzip file
             *
             */
            this.unpack     = function(current) {
               twopack(current, {
                    unpack: true
                });
            };
            
            /**
             * prompt and delete current file or selected files
             *
             * @currentFile
             */
            this.promptDelete       = function(currentFile) {
                var ret, type, isDir, msg, current,
                    name        = '',
                    msgAsk      = 'Do you really want to delete the ',
                    msgSel      = 'selected ',
                    files       = Cmd.getSelectedFiles(),
                    names       = Cmd.getSelectedNames(files),
                    i, n        = names && names.length;
                
                if (!Cmd.isCurrentFile(currentFile))
                    current    = DOM.getCurrentFile();
                
                if (n) {
                    for (i = 0; i < 5 && i < n; i++)
                        name += '\n' + names[i];
                    
                    if (n >= 5)
                        name   += '\n...';
                    
                    msg    = msgAsk + msgSel + n + ' files/directoris?\n' + name ;
                } else {
                    isDir       = Cmd.isCurrentIsDir(current);
                    
                    if (isDir)
                        type    ='directory';
                    else
                        type    = 'file';
                     
                     type += ' ';
                    
                    name   = Cmd.getCurrentName(current);
                    msg    = msgAsk + msgSel + type + name + '?';
                }
                
                if (name !== '..')
                    ret  = Dialog.confirm(msg);
                else
                    Dialog.alert('No files selected!');
                
                if (ret)
                    DOM.sendDelete(files);
                
                return ret;
            };
            
            /**
             * delete current or selected files
             *
             * @files
             */
            this.sendDelete         = function(files) {
                var n, names, path,
                    query       = '',
                    RESTful     = DOM.RESTful,
                    current     = CurrentInfo.element;
                    
                if (!files)
                    files       = Cmd.getSelectedFiles();
                
                names       = DOM.getSelectedNames(files),
                n           = names && names.length;
                
                if (n) {
                    path    = Cmd.getCurrentDirPath();
                    query   = '?files';
                } else {
                    path    = Cmd.getCurrentPath(current);
                }
                
                RESTful.delete(path + query, names, function() {
                    var Storage     = DOM.Storage,
                        dirPath     = CurrentInfo.dirPath,
                        dir         = CloudFunc.rmLastSlash(dirPath);
                    
                    if (n > 1)
                        DOM.deleteSelected(files);
                    else
                        DOM.deleteCurrent(current);
                    
                    Storage.removeMatch(dir);
                });
            };
            
            /**
             * get current direcotory name
             */
            this.getCurrentDirName           = function() {
                var ret,
                    lSubstr,
                    /* получаем имя каталога в котором находимся */
                    lHref   = this.getCurrentDirPath();
                
                lHref       = CloudFunc.rmLastSlash(lHref);
                lSubstr     = lHref.substr(lHref , lHref.lastIndexOf('/'));
                ret        = Util.rmStrOnce(lHref, lSubstr + '/') || '/';
                
                return ret;
            };
            
            /**
             * get current direcotory path
             */
            this.getCurrentDirPath       = function(panel) {
                var ret, path;
                
                if (!panel)
                    panel   =  this.getPanel();
                
                path        =  this.getByDataName('js-path', panel);
                ret         = path && path.textContent;
                
                return ret;
            };
            
            /**
             * get current direcotory path
             */
            this.getParentDirPath       = function(panel) {
                var path    = DOM.getCurrentDirPath(panel),
                    dirName = DOM.getCurrentDirName() + '/',
                    ret     = '/';
                
                if (path !== '/')
                    ret = Util.rmStr(path, dirName);
                
                return ret;
            };
            
            /**
             * get not current direcotory path
             */
            this.getNotCurrentDirPath       = function() {
                var panel  = this.getPanel(true),
                    path   = this.getCurrentDirPath(panel);
                
                return path;
            };
            
            /**
             * unified way to get current file
             *
             * @currentFile
             */
            this.getCurrentFile          = function() {
                var ret = this.getByClass(CURRENT_FILE);
                
                return ret;
            };
            
            /**
             * get current file by name
             */
            this.getCurrentFileByName       = function(name) {
                var element,
                    panel   = CurrentInfo.panel;
                
                name    = 'js-file-' + name;
                element = DOM.getByDataName(name, panel);
                
                return element;
            };
            
            /**
             * unified way to get current file
             *
             * @currentFile
             */
            this.getSelectedFiles         = function() {
                var panel       = DOM.getPanel(),
                    selected    = this.getByClassAll(SELECTED_FILE, panel),
                    ret         = Util.slice(selected);
                
                return ret;
            };
            
            /**
             * get all selected files with current included
             *
             * @currentFile
             */
            this.getActiveFiles         = function() {
                var current     = DOM.getCurrentFile(),
                    files       = DOM.getSelectedFiles(),
                    selected    = ~files.indexOf(current);
                
                if (!selected)
                    files.push(current);
                
                return files;
            };
            
            /**
             * get size
             * @currentFile
             */
            this.getCurrentSize          = function(currentFile) {
                var ret,
                    current     = currentFile || Cmd.getCurrentFile(),
                    size        = this.getByClass('size', current);
                
                size       = size.textContent;
                /* если это папка - возвращаем слово dir вместо размера*/
                ret        = Util.rmStrOnce(size, ['<', '>']);
                
                return ret;
            };
            
            /**
             * get size
             * @currentFile
             */
            this.loadCurrentSize          = function(callback, currentFile) {
                var RESTful     = DOM.RESTful,
                    Images      = DOM.Images,
                    current     = currentFile || this.getCurrentFile(),
                    query       = '?size',
                    link        = this.getCurrentPath(current);
                
                Images.showLoad();
                
                if (name !== '..')
                    RESTful.read(link + query, function(size) {
                        DOM.setCurrentSize(size, current);
                        Util.exec(callback, current);
                        Images.hide();
                    });
            };
            
            /**
             * load hash
             * @callback
             * @currentFile
             */
            this.loadCurrentHash          = function(callback, currentFile) {
                var RESTful     = DOM.RESTful,
                    current     = currentFile || DOM.getCurrentFile(),
                    query       = '?hash',
                    link        = DOM.getCurrentPath(current);
                
                RESTful.read(link + query, function(data) {
                    callback(null, data);
                });
            };
            
            /**
             * load current modification time of file
             * @callback
             * @currentFile
             */
            this.loadCurrentTime          = function(callback, currentFile) {
                var RESTful     = DOM.RESTful,
                    current     = currentFile || this.getCurrentFile(),
                    query       = '?time',
                    link        = this.getCurrentPath(current);
                
                RESTful.read(link + query, callback);
            };
            
            /**
             * set size
             * @currentFile
             */
            this.setCurrentSize          = function(size, currentFile) {
                var current         = currentFile || this.getCurrentFile(),
                    sizeElement     = this.getByClass('size', current);
                
                sizeElement.textContent = size;
            
            };
            
            /**
             * @currentFile
             */
            this.getCurrentMode          = function(currentFile) {
                var ret,
                    current    = currentFile || this.getCurrentFile(),
                    lMode       = this.getByClass('mode', current);
                    ret        = lMode.textContent;
                
                return ret;
            };
            
            /**
             * @currentFile
             */
            this.getCurrentOwner         = function(currentFile) {
                var ret,
                    current     = currentFile || this.getCurrentFile(),
                    owner       = this.getByClass('owner', current);
                
                ret             = owner.textContent;
                
                return ret;
            };
            
            /**
             * unified way to get current file content
             *
             * @param callback
             * @param currentFile
             */
             this.getCurrentData             = function(callback, currentFile) {
                var hash,
                    RESTful         = DOM.RESTful,
                    current         = currentFile || DOM.getCurrentFile(),
                    path            = DOM.getCurrentPath(current),
                    isDir           = DOM.isCurrentIsDir(current),
                    
                    func            = function(data) {
                        var length,
                           ONE_MEGABYTE    = 1024 * 1024 * 1024;
                        
                        if (Util.type.object(data))
                            data = Util.json.stringify(data);
                        
                        length  = data.length;
                        if (hash && length < ONE_MEGABYTE)
                            DOM.saveDataToStorage(path, data, hash);
                        
                        Util.exec(callback, null, data);
                    };
                
                if (isDir)
                    RESTful.read(path, func);
                else
                    DOM.checkStorageHash(path, function(error, equal, hashNew) {
                        Util.exec.if(!error && equal, function() {
                                DOM.getDataFromStorage(path, callback);
                            }, function() {
                                hash = hashNew;
                                RESTful.read(path, func);
                            });
                        });
            };
            
            
            /**
             * unified way to save current file content
             *
             * @callback - function({data, name}) {}
             * @currentFile
             */
            this.saveCurrentData             = function(url, data, callback, query) {
                if (!query)
                    query = '';
                
                DOM.RESTful.write(url + query, data, function() {
                    DOM.saveDataToStorage(url, data);
                });
            };
            
            /**
             * unified way to get RefreshButton
             */
            this.getRefreshButton        = function() {
                var panel   = this.getPanel(),
                    refresh = this.getByDataName('js-refresh', panel);
                
                return refresh;
            };
            
            
            /**
             * unified way to set current file
             */
            this.setCurrentFile          = function(currentFile, options) {
                var ret, path, pathWas, title,
                    o               = options,
                    FS              = CloudFunc.FS,
                    CENTER          = true,
                    currentFileWas  = this.getCurrentFile();
                
                if (currentFile) {
                    if (currentFileWas) {
                        pathWas     = DOM.getCurrentDirPath();
                        unsetCurrentFile(currentFileWas);
                    }
                    
                    this.addClass(currentFile, CURRENT_FILE);
                    
                    path        = DOM.getCurrentDirPath();
                    
                    if (path !== pathWas) {
                        title   = CloudFunc.getTitle(path);
                        this.setTitle(title);
                        
                        /* history could be present
                         * but it should be false
                         * to prevent default behavior
                         */
                        if (!o || o.history !== false) {
                            if (path !== '/')
                                path    = FS + path;
                            
                            DOM.setHistory(path, null, path);
                        }
                    }
                    
                    /* scrolling to current file */
                    this.scrollIntoViewIfNeeded(currentFile, CENTER);
                    
                    ret = true;
                    
                    Cmd.updateCurrentInfo();
                }
                
                return  this;
            };
            
             /*
              * set current file by position
              *
              * @param layer    - element
              * @param          - position {x, y}
              */
            this.getCurrentByPosition               = function(position) {
                var element, tag, isChild,
                    x   = position.x,
                    y   = position.y;
                
                element = document.elementFromPoint(x, y),
                tag     = element.tagName;
                
                isChild = Util.strCmp(tag, ['A', 'SPAN', 'LI']);
                
                if (!isChild) {
                    element = null;
                } else {
                    switch (tag) {
                    case 'A':
                        element = element.parentElement.parentElement;
                        break;
                    
                    case 'SPAN':
                        element = element.parentElement;
                        break;
                    }
                }
                
                return element;
            };
            
            /**
             * select current file
             * @param currentFile
             */
            this.toggleSelectedFile              = function(currentFile) {
                var current     = currentFile || this.getCurrentFile(),
                    ret        = this.toggleClass(current, SELECTED_FILE);
                
                return ret;
            };
            
            this.toggleAllSelectedFiles         = function() {
                var i, n,
                    panel       = DOM.getPanel(),
                    files       = DOM.getFiles(panel),
                    name        = DOM.getCurrentName(files[0]);
                
                if (name === '..')
                    i = 1;
                else
                    i = 0;
                
                n = files.length;
                for (;i < n; i++)
                    DOM.toggleSelectedFile(files[i]);
                
                return Cmd;
            };
            
            function selectByPattern(msg, files) {
                var n, regExp,
                    allMsg      = 'Specify file type for ' + msg + ' selection',
                    i           = 0,
                    type,
                    matches     = 0,
                    name,
                    shouldSel   = msg === 'expand',
                    isSelected, isMatch,
                    current;
                
                type            = Dialog.prompt(allMsg, SelectType);
                
                if (type !== null) {
                    SelectType  = type;
                    
                    regExp      = Util.getRegExp(type);
                    
                    n           = files && files.length;
                    for (i = 0; i < n; i++) {
                        current = files[i];
                        name    = DOM.getCurrentName(current);
                            
                        if (name !== '..') {
                            isMatch     = regExp.test(name);
                            
                            if (isMatch) {
                                ++matches;
                                
                                isSelected  = DOM.isSelected(current);
                                
                                if (shouldSel)
                                    isSelected = !isSelected;
                                
                                if (isSelected)
                                    DOM.toggleSelectedFile(current);
                            }
                        }
                    }
                    
                    if (!matches)
                        Dialog.alert('No matches found!');
                }
            }
            
            /* 
             * open dialog with expand selection
             */
            this.expandSelection                = function() {
                var msg     = 'expand',
                    files   = CurrentInfo.files;
                
                selectByPattern(msg, files);
            };
            
            /* 
             * open dialog with shrink selection
             */
            this.shrinkSelection                = function() {
                var msg     = 'shrink',
                    files   = DOM.getSelectedFiles();
               
               selectByPattern(msg, files);
            };
            
            /**
             * setting history wrapper
             */
            this.setHistory              = function(data, pTitle, url) {
                var ret = window.history;
                
                if (ret)
                    history.pushState(data, pTitle, url);
                
                return ret;
            };
            
            /**
             * set title or create title element 
             * 
             * @param name
             */    
            
            this.setTitle                = function(name) {
                if (!Title)
                    Title = DOM.getByTag('title')[0] ||
                            DOM.load({
                                name            :'title',
                                innerHTML       : name,
                                parentElement   : document.head
                            });
                
                Title.textContent = name;
                
                return this;
            };
            
            /**
             * current file check
             * 
             * @param currentFile
             */
            this.isCurrentFile           = function(currentFile) {
                var ret;
                
                if (currentFile )
                    ret = this.isContainClass(currentFile, CURRENT_FILE);
                
                return ret;
            };
            
            /**
             * selected file check
             * 
             * @param currentFile
             */
            this.isSelected              = function(pSelected) {
                var ret;
                
                if (pSelected )
                    ret = this.isContainClass(pSelected, SELECTED_FILE);
                
                return ret;
            };
            
            /**
             * check is current file is a directory
             * 
             * @param currentFile
             */
            this.isCurrentIsDir            = function(currentFile) {
                var current    = currentFile || this.getCurrentFile(),
                    lFileType   = this.getByClass('mini-icon', current),
                    ret        = this.isContainClass(lFileType, 'directory');
                
                return ret;
            };
            
            
           /**
             * get link from current (or param) file
             * 
             * @param currentFile - current file by default
             */
            this.getCurrentLink          = function(currentFile) {
                var lLink = this.getByTag( 'a', currentFile || this.getCurrentFile()),
                    
                    ret = lLink.length > 0 ? lLink[0] : -1;
                
                return ret;
            };
            
            /**
             * get link from current (or param) file
             * 
             * @param currentFile - current file by default
             */
            this.getCurrentPath          = function(currentFile) {
                var current     = currentFile || DOM.getCurrentFile(),
                    element     = DOM.getByTag('a', current)[0],
                    path        = element.getAttribute('href');
                
                path            = Util.rmStrOnce(path, CloudFunc.FS);
                
                return path;
            };
            
            /**
             * get name from current (or param) file
             * 
             * @param currentFile
             */
            this.getCurrentName          = function(currentFile) {
                var name        = '',
                    current     = currentFile || this.getCurrentFile(),
                    link        = this.getCurrentLink(current);
                    
                if (link)
                   name = link.title || link.textContent;
                
                return name;
            };
            
            this.getSelectedNames        = function(selected) {
                var first, name, isSelected,
                    ret = [];
                
                if (!selected)
                    selected = this.getSelectedFiles() || [];
                
                first           = selected[0];
                
                if (first) {
                    name        = this.getCurrentName(first);
                } else {
                    first       = this.getCurrentFile();
                    name        = this.getCurrentName(first);
                }
                
                isSelected  = this.isSelected(first);
                
                if (name === '..' && isSelected) {
                    selected.shift();
                    this.toggleSelectedFile(first);
                }
                
                ret = selected.map(function(current) {
                    return Cmd.getCurrentName(current);
                });
                
                return ret;
            };
            
            /**
             * set name from current (or param) file
             * 
             * @param name
             * @param current
             */
            this.setCurrentName          = function(name, current) {
                var Info    = CurrentInfo,
                    link    = Info.link,
                    FS      = CloudFunc.FS,
                    dir     = FS + Info.dirPath;
                
                link.title  = link.textContent = name;
                link.href   = dir + name;
                
                current.setAttribute('data-name', 'js-file-' + name);
                
                return link;
            };
            
            /**
             * check storage hash 
             */
            this.checkStorageHash       = function(name, callback) {
                var Storage         = DOM.Storage,
                    parallel        = Util.exec.parallel,
                    loadHash        = DOM.loadCurrentHash,
                    nameHash        = name + '-hash',
                    getStoreHash    = Util.exec.with(Storage.get, nameHash);
                
                Util.checkArgs(arguments, ['name', 'callback']);
                
                parallel([loadHash, getStoreHash], function(error, loadHash, storeHash) {
                    var equal,
                        isContain   = Util.isContainStr(loadHash, 'error');
                    
                    if (isContain)
                        error = loadHash;
                    else if (loadHash === storeHash)
                        equal = true;
                    
                    callback(error, equal, loadHash);
                });
            };
            
            /**
             * save data to storage
             * 
             * @param name
             * @param data
             * @param callback 
             */
            this.saveDataToStorage = function(name, data, hash, callback) {
                DOM.Files.get('config', function(error, config) {
                    var allowed     = config.localStorage,
                        isDir       = DOM.isCurrentIsDir(),
                        nameHash    = name + '-hash',
                        nameData    = name + '-data';
                    
                    if (!allowed || isDir)
                        Util.exec(callback);
                    else
                        Util.exec.if(hash, function() {
                            var Storage = DOM.Storage;
                            
                            Storage.set(nameHash, hash);
                            Storage.set(nameData, data);
                            
                            Util.exec(callback, hash);
                        }, function(callback) {
                            DOM.loadCurrentHash(function(error, loadHash) {
                                hash = loadHash;
                                callback();
                            });
                        });
                });
            };
            
            /**
             * save data to storage
             * 
             * @param name
             * @param data
             * @param callback 
             */
            this.getDataFromStorage = function(name, callback) {
                DOM.Files.get('config', function(error, config) {
                    var Storage     = DOM.Storage,
                        nameHash    = name + '-hash',
                        nameData    = name + '-data',
                        allowed     = config.localStorage,
                        isDir       = DOM.isCurrentIsDir();
                    
                    if (!allowed || isDir)
                        Util.exec(callback);
                    else {
                        Util.exec.parallel([
                            function(callback) {
                                Storage.get(nameData, callback);
                            },
                            function(callback) {
                                Storage.get(nameHash, callback);
                            }
                        ], callback);
                    }
                });
            };
            
            /** function getting FM
             * @param pPanel_o = {active: true}
             */
            this.getFM                   = function() {
                return this.getPanel().parentElement;
            };
            
            /** function getting panel active, or passive
             * @param options = {active: true}
             */
            this.getPanel                = function(options) {
                var id          = 'js-',
                    current     = this.getCurrentFile(),
                    files       = current.parentElement,
                    panel       = files.parentElement,
                    isLeft      = panel.id === 'js-left';
                    
                /* if {active : false} getting passive panel */
                if (options && !options.active) {
                    id          += isLeft ? 'right' : 'left';
                    panel       = this.getById(id);
                }
                
                /* if two panels showed
                 * then always work with passive
                 * panel
                 */
                if (window.innerWidth < CloudCmd.MIN_ONE_PANEL_WIDTH)
                    panel = this.getById('js-left');
                    
                
                if (!panel)
                    Util.log('Error can not find Active Panel');
                    
                return panel;
            };
            
            this.getFiles               = function(element) {
                var files = DOM.getByDataName('js-files', element),
                    ret     = files.children || [];
                
                return ret;
            };
            
            /**
             * shows panel right or left (or active)
             */
            this.showPanel               = function(pActive) {
                var ret = true,
                    lPanel = this.getPanel(pActive);
                                
                if (lPanel)
                    this.show(lPanel);
                else
                    ret = false;
                
                return ret;
            };
            
            /**
             * hides panel right or left (or active)
             */
            this.hidePanel               = function(pActive) {
                var ret = false,
                    lPanel = this.getPanel(pActive);
                
                if (lPanel)
                    ret = this.hide(lPanel);
                
                return ret;
            };
                
            /**
             * open window with URL
             * @param url
             */
            this.openWindow              = function(url) {
                var left        = 140,
                    top         = 187,
                    width       = 1000,
                    height      = 650,
                    
                    options     = 'left='   + left          +
                        ',top='             + top           +
                        ',width='           + width         +
                        ',height='          + height        +
                        ',personalbar=0,toolbar=0'          +
                        ',scrollbars=1,resizable=1',
                    
                    wnd         = window.open(url, 'Cloud Commander Auth', options);
                
                if (!wnd)
                    Dialog.alert('Please disable your popup blocker and try again.');
            };
            
            /**
             * remove child of element
             * @param pChild
             * @param element
             */
            this.remove                  = function(child, element) {
                var parent = element || document.body;
                
                parent.removeChild(child);
                    
                return DOM;
            };
            
            /**
             * remove current file from file table
             * @param current
             * 
             */
            this.deleteCurrent           = function(current) {
                var name, next, prev, parent, currentNew;
                
                if (!current)
                    Cmd.getCurrentFile();
                
                parent      = current && current.parentElement;
                name        = Cmd.getCurrentName(current);
                
                if (current && name !== '..') {
                    next    = current.nextSibling,
                    prev    = current.previousSibling;
                        
                    if (next)
                        currentNew = next;
                    else if (prev)
                        currentNew = prev;
                    
                    this.setCurrentFile(currentNew);
                    
                    parent.removeChild(current);
                }
                
                return currentNew;
            };
            
             /**
             * remove selected files from file table
             * @Selected
             */
            this.deleteSelected          = function(selected) {
                var i, n, current;
                
                if (!selected)
                    selected = this.getSelectedFiles();
                
                if (selected) {
                    n = selected.length;
                    
                    for (i = 0; i < n; i++) {
                        current = selected[i];
                        this.deleteCurrent(current);
                    }
                }
                
                return selected;
            };
            
            /**
             * rename current file
             * 
             * @currentFile
             */
            this.renameCurrent            = function(current) {
                var from, to, dirPath, cmp, files,
                    RESTful     = DOM.RESTful;
                
                if (!Cmd.isCurrentFile(current))
                    current = Cmd.getCurrentFile();
                
                from        = Cmd.getCurrentName(current),
                to          = Dialog.prompt('Rename', from) || from,
                dirPath     = Cmd.getCurrentDirPath();
                cmp         = Util.strCmp(from, to);
                
                if (!cmp) {
                    files      = {
                        from    : dirPath + from,
                        to      : dirPath + to
                    };
                    
                    RESTful.mv(files, function() {
                        var Storage = DOM.Storage,
                            path    = CloudFunc.rmLastSlash(dirPath);
                        
                        DOM.setCurrentName(to, current);
                        Cmd.updateCurrentInfo();
                        Storage.remove(path);
                    });
                }
            };
            
            /*
             * process files (copy or move)
             * @param operation
             */
            function processFiles(operation, data) {
                 var n, name, files, cmp, msg, opFunc,
                    RESTful     = DOM.RESTful,
                    
                    from        = '',
                    to          = '',
                    
                    names       = [],
                    
                    length      = 0;
                
                if (operation.copy) {
                    opFunc      = RESTful.cp;
                    msg         = 'Copy ';
                } else if (operation.move) {
                    opFunc      = RESTful.mv;
                    msg         = 'Rename/Move ';
                }
                
                if (data) {
                    from    = data.from;
                    to      = data.to;
                    names   = data.names;
                } else {
                    from        = CurrentInfo.dirPath;
                    to          = DOM.getNotCurrentDirPath();
                    
                    names       = Cmd.getSelectedNames();
                    length      = names && names.length;
                    
                    if (!length) {
                        name        = DOM.getCurrentName();
                        names.push(name);
                    } else if (length === 1) {
                        name    = names[0];
                    }
                    
                    if (length > 1)
                        msg     += n + ' file(s)';
                    else
                        msg     += '"' + name + '"';
                    
                    msg         += ' to';
                }
                
                if (name === '..') {
                    Dialog.alert('No files selected!');
                } else {
                    Images.showLoad({
                        top:true
                    });
                    
                    if (!data)
                        to          = Dialog.prompt(msg, to);
                    
                    cmp         = Util.strCmp(from, to);
                    
                    if (!cmp && to) {
                        files   = {
                            from    : from,
                            to      : to,
                            names   : names
                        };
                        
                        opFunc(files, function() {
                            var path            = CloudFunc.rmLastSlash(from);
                            
                            DOM.Storage.remove(path, function() {
                                var panel           = DOM.getPanel(),
                                    panelPassive    = DOM.getPanel(true),
                                    id              = panelPassive.id,
                                    dotDot          = DOM.getById( '..(' + id + ')');
                                
                                if (!data) {
                                    DOM.setCurrentFile(dotDot);
                                    
                                    CloudCmd.refresh(panel);
                                    CloudCmd.refresh(panelPassive);
                                } else {
                                    CloudCmd.refresh(panelPassive);
                                    CloudCmd.refresh(panel);
                                }
                            });
                        });
                    }
                }
            }
            
            this.copyFiles      = function(data) {
                processFiles({
                    copy: true
                }, data);
            };
            
            
            this.moveFiles      = function(data) {
                processFiles({
                    move: true
                }, data);
            };
            
            /**
             * unified way to scrollIntoViewIfNeeded
             * (native suporte by webkit only)
             * @param element
             * @param pCenter
             */
            this.scrollIntoViewIfNeeded  = function(element, center) {
                var ret = element && element.scrollIntoViewIfNeeded;
                
                /* for scroll as small as possible
                 * param should be false
                 */
                if (arguments.length === 1)
                    center = false;
                
                if (ret)
                    element.scrollIntoViewIfNeeded(center);
                
                return ret;
            };
            
            /* scroll on one page*/
            this.scrollByPages           = function(element, pPages) {
               var ret = element && element.scrollByPages && pPages;
                
                if (ret)
                    element.scrollByPages(pPages);
                
                return ret;
            };
            
            this.getType                = function(name, callback) {
                DOM.Files.get('ext', function(error, extensions) {
                    var index,
                        ext = Util.getExt(name);
                    
                    ext     = extensions[ext];
                    
                    if (ext) {
                        index   = ext.indexOf('/') + 1;
                        ext     = ext.substr(index);
                    }
                    
                    Util.exec(callback, ext);
              });
            };
            
            this.changePanel            = function() {
                var id, files,
                    Info            = CurrentInfo,
                    current         = Info.element,
                    panel           = Info.panel,
                    filesPassive    = Info.filesPassive;
                
                id              = panel.id;
                TabPanel[id]    = current;
                
                panel           = Info.panelPassive;
                id              = panel.id;
                
                current         = TabPanel[id];
                
                if (current)
                    files       = current.parentElement;
                
                if (!files || !files.parentElement)
                    current     = filesPassive[0];
                
                DOM.setCurrentFile(current, {
                    history: true
                });
                
                return this;
            };
            
            this.CurrentInfo            = CurrentInfo,
            
            this.updateCurrentInfo      = function(currentFile) {
                var info            = Cmd.CurrentInfo,
                    current         = currentFile || Cmd.getCurrentFile(),
                    files           = current.parentElement,
                    panel           = files.parentElement,
                    
                    panelPassive    = Cmd.getPanel({active:false}),
                    filesPassive    = DOM.getFiles(panelPassive),
                    
                    name            = Cmd.getCurrentName(current);
                
                info.dir            = Cmd.getCurrentDirName();
                info.dirPath        = Cmd.getCurrentDirPath();
                info.parentDirPath  = Cmd.getParentDirPath();
                info.element        = current;
                info.ext            = Util.getExt(name);
                info.files          = files.children,
                info.filesPassive   = filesPassive,
                info.first          = files.firstChild;
                info.getData        = Cmd.getCurrentData;
                info.last           = files.lastChild;
                info.link           = Cmd.getCurrentLink(current);
                info.mode           = Cmd.getCurrentMode(current);
                info.name           = name;
                info.path           = Cmd.getCurrentPath(current);
                info.panel          = panel;
                info.panelPassive   = panelPassive;
                info.size           = Cmd.getCurrentSize(current);
                info.isDir          = Cmd.isCurrentIsDir();
                info.isSelected     = Cmd.isSelected(current);
            };
        
        },
        
        DOMTree                     = Util.extendProto(DOMTreeProto),
        Images                      = Util.extendProto(ImagesProto);
    
    DOMProto                        = DOMFunc.prototype = new CmdProto();
    
    Dialog                          = new DialogProto();
    
    Util.extend(DOMProto, [
        DOMTree, {
            Images  : Images,
            Dialog  : Dialog
        }
    ]);
    
    DOM                             = new DOMFunc();
    
})(Util, window);
