var CloudCmd, Util, DOM, CloudFunc, $;

(function(CloudCmd, Util, DOM, CloudFunc) {
    'use strict';
    
    CloudCmd.View = ViewProto;
        
    function ViewProto(CallBack) {
        var Name        = 'View',
            Loading     = false,
            FocusWas    = false,
            Events      = DOM.Events,
            Info        = DOM.CurrentInfo,
            Key         = CloudCmd.Key,
            Images      = DOM.Images,
            View        = Util.exec.bind(Util),
            Element, TemplateAudio, Overlay,
            Config      = {
                beforeShow      : function(callback) {
                    Images.hide();
                    Key.unsetBind();
                    showOverlay();
                    Util.exec(callback);
                },
                beforeClose     : function(callback) {
                    Key.setBind();
                    Util.exec(callback);
                    hideOverlay();
                },
                afterShow       : function(callback) {
                    if (!FocusWas) {
                        Element.focus();
                        FocusWas = true;
                    }
                    
                    Util.exec(callback);
                },
                afterClose      : function(callback) {
                    FocusWas = false;
                    
                    Util.exec(callback);
                },
                fitToView       : true,
                loop            : false,
                openEffect      : 'none',
                closeEffect     : 'none',
                autoSize        : false,
                height          : '100%',
                width           : '100%',
                minWidth        : 0,
                minHeight       : 0,
                padding         : 0,
                preload         : 0,
                keys            : null,
                mouseWheel      : false,
                arrows          : false,
                helpers         : {
                    overlay : null,
                    title   : null
                }
            };
        
        View.show   = show;
        View.hide   = hide;
        
        function init() {
            var func = CallBack || Util.exec.with(show, null);
            
            Loading = true;
            
            Util.exec.series([
                DOM.loadJquery,
                load,
                function(callback) {
                    Loading = false;
                    Util.exec(callback);
                },
                func
            ]);
            
            Config.parent = Overlay = DOM.load({
                id          : 'js-view',
                name        : 'div',
                className   : 'fancybox-overlay fancybox-overlay-fixed'
            });
            
            Events.addClick(Util.exec.with(onOverLayClick, Overlay), Overlay);
            Events.addKey(listener);
        }
        
        /**
         * function shows FancyBox
         */
        function show(data, options) {
            var path, element, type,
                config = {};
            
            if (!Loading) {
                Element         = $('<div class="view" tabindex=0>');
                
                if (data) {
                    element    = $(Element).append(data);
                    
                    Util.copyObj(config, Config);
                    
                    if (options)
                        Object.keys(options).forEach(function(name) {
                            var func,
                                isConfig        = !!config[name],
                                series          = Util.exec.series,
                                item            = options[name],
                                isFunc          = Util.type.function(item);
                            
                            if (isFunc && isConfig) {
                                func            = config[name];
                                config[name]    = function() {
                                    series([func, item]);
                                };
                            } else {
                                config[name]    = options[name];
                            }
                        });
                    
                    $.fancybox(element, config);
                    
                } else {
                    Images.showLoad();
                    path    = CloudFunc.FS + Info.path;
                    type    = getType(path);
                    
                    switch(type) {
                    default:
                        Info.getData(function(error, data) {
                                var element = document.createTextNode(data);
                                /* add margin only for view text documents */
                                Element.css('margin', '2%');
                                
                                $.fancybox(Element.append(element), Config);
                            });
                        break;
                    
                    case 'image':
                        config = Util.copyObj({
                                autoSize    : true,
                                type        : 'image'
                            }, Config);
                            
                        $.fancybox.open(path, config);
                        break;
                    
                    case 'media':
                         getMediaElement(path, function(element) {
                            var media       = DOM.getByDataName('js-media', element),
                                onKey       = Util.exec.with(onMediaKey, media);
                                
                            $.fancybox.open(element, {
                                parent      : Overlay,
                                beforeShow  : function() {
                                    Config.beforeShow();
                                    Events.addKey(onKey);
                                },
                                beforeClose : function() {
                                    Config.beforeClose();
                                    Events.rmKey(onKey);
                                },
                                helpers: {
                                    overlay : null,
                                    title   : null
                                }
                            });
                        });
                        break;
                    }
                }
            }
        }
        
        function hide() {
            $.fancybox.close();
        }
        
        function isImage(name) {
            var isMatch;
                
            isMatch = Util.checkExt(name, [
                'jp(e|g|eg)',
                'gif',
                'png',
                'bmp',
                'webp',
                'svg',
                'ico'
            ]);
            
            return isMatch;
        }
        
        function isMedia(name) {
            var isMatch;
            
            isMatch     = isAudio(name) || isVideo(name);
            
            return isMatch;
        }
        
        function isAudio(name) {
            var isMatch;
            
            isMatch     = Util.checkExt(name, ['mp3', 'ogg']);
            
            return isMatch;
        }
        
        function isVideo(name) {
            var isMatch;
            
            isMatch = Util.checkExt(name, ['mp4', 'avi']);
            
            return isMatch;
        }
        
        function getType(name) {
            var type;
            
            if (isImage(name))
                type    = 'image';
            else if (isMedia(name))
                type    = 'media';
            
            return type;
        }
        
        function getMediaElement(src, callback) {
            Util.checkArgs(arguments, ['src', 'callback']);
            
            DOM.Files.get('view/media-tmpl', function(error, template) {
                var rendered, element, type, is,
                    name = Info.name;
                
                if (error) {
                    Util.log(error);
                } else {
                    if (!TemplateAudio)
                        TemplateAudio   = template;
                    
                    is      = isAudio(name);
                    type    =  is ? 'audio' : 'video';
                    
                    rendered    = Util.render(TemplateAudio, {
                        src : src,
                        type: type,
                        name: Info.name
                    });
                    
                    element     = $(rendered)[0];
                    callback(element);
                }
            });
        }
        
        function onMediaKey(media, event) {
            var key = event.keyCode;
            
            if (key === Key.SPACE) {
                if (media.paused)
                    media.play();
                else
                    media.pause();
            }
        }
        
        /**
         * function loads css and js of FancyBox
         * @callback   -  executes, when everything loaded
         */
        function load(callback) {
            Util.time(Name + ' load');
            
            DOM.loadRemote('fancybox', function() {
                var prefix = CloudCmd.PREFIX;
                
                DOM.load.css(prefix + '/css/view.css', callback);
                
                DOM.load.style({
                    id:'view-css',
                    inner : '#fancybox-loading {'   +
                            'display: none'         +
                        '}'
                    });
            });
        }
        
        function onOverLayClick(overlay, event) {
            var isCurrent, isFiles, isFilesPassive,
                files       = Util.slice(Info.files),
                filesPassive= Util.slice(Info.filesPassive),
                position    = CloudCmd.MousePosition,
                element     = event.target,
                isOverlay   = element === overlay;
              
            if (isOverlay) {
                hideOverlay();
                element     = DOM.getCurrentByPosition(position);
                
                if (element) {
                    isFiles         = ~files.indexOf(element);
                    isFilesPassive  = ~filesPassive.indexOf(element);
                    
                    if (isFiles || isFilesPassive) {
                        isCurrent = DOM.isCurrentFile(element);
                        
                        if (!isCurrent)
                            DOM.setCurrentFile(element);
                    }
                }
                
                View.hide();
            }
        }
        
        function hideOverlay() {
            DOM.removeClass(Overlay, 'view-overlay');
        }
        
        function showOverlay() {
            DOM.addClass(Overlay, 'view-overlay');
        }
        
        function listener(event) {
            var keyCode = event.keyCode,
                ESC     = Key.ESC;
            
            if (keyCode === ESC)
                hide();
        }
        
        init();
        
        return View;
    }

})(CloudCmd, Util, DOM, CloudFunc);
