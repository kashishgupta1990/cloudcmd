var MenuIO, Util;

(function (window) {
    'use strict';
    
    MenuIO = function(element, options, menuData) {
        if (!(this instanceof MenuIO)) {
            return new MenuIO(element, options, menuData);
        }
        
        var ElementMenu,
            Element,
            Options         = {},
            ElementFuncs    = new ElementFuncsProto(),
            ElementHeight,
            ElementEvent,
            MenuFuncs       = {},
            TEMPLATE        = {
                MAIN:   '<ul data-name="js-menu" class="menu menu-hidden">'                             +
                            '{{ items }}'                                                               +
                        '</ul>',
                ITEM:   '<li data-name="js-menu-item" class="menu-item{{ className }}"{{ attribute }}>' +
                            '<label data-menu-path="{{ path }}">{{ name }}</label>'                     +
                            '{{ subitems }}'                                                            +
                        '</li>'
            };
        
        if (menuData) {
            Element         =
            ElementEvent    = element;
            Options         = options;
        } else if (options) {
            Element         =
            ElementEvent    = element;
            menuData        = options;
        } else {
            Element         = document.body;
            ElementEvent    = window;
            menuData        = element;
        }
        
        function init() {
            var name, isObj = Util.type.object(menuData);
            
            if (!isObj) {
                name            = menuData;
                menuData        = {};
                menuData[name]  = null;
            }
            
            ElementMenu         = createMenu(menuData);
            
            ElementEvent.addEventListener('click', onClick);
            ElementEvent.addEventListener('contextmenu', onContextMenu);
        }
        
        function createMenu(menuData) {
            var menu,
                items       = '',
                buildItems  = function(menuData, path) {
                    var DATA_MENU   = 'data-menu="js-submenu"',
                        items       = '';
                    
                    if (path)
                        path        += '.';
                    else
                        path        = '';
                    
                    Object.keys(menuData).forEach(function(name) {
                        var nameIcon,
                            subitems    = '',
                            className   = '',
                            attribute   = '',
                            pathName    = path + name,
                            
                            data        = menuData[name],
                            isObj       = Util.type.object(data);
                        
                        if (!isObj) {
                            MenuFuncs[pathName] = data;
                        } else {
                            subitems    = Util.render(TEMPLATE.MAIN, {
                                items: buildItems(data, pathName)
                            });
                            
                            className   = ' menu-submenu';
                            attribute   = ' ' + DATA_MENU;
                        }
                        
                        if (Options.icon) {
                            nameIcon    = Util.convertName(name);
                            className  += ' icon icon-' + nameIcon;
                        }
                        
                        items           += Util.render(TEMPLATE.ITEM, {
                            name        : name,
                            subitems    : subitems,
                            className   : className,
                            attribute   : attribute,
                            path        : pathName
                        });
                    });
                    
                    return items;
                };
            
            items = buildItems(menuData);
            
            menu  = document.createElement('ul');
            menu.setAttribute('data-name', 'js-menu');
            menu.className  = 'menu menu-hidden';
            menu.innerHTML  = items;
            
            Element.appendChild(menu);
            
            return menu;
        }
        
        this.show   = showMenuElement;
        this.hide   = hideMenuElement;
        
        function checkElement(target, position) {
            var is,
                element = ElementFuncs.getItem(target),
                isName  = ElementFuncs.isName(element),
                isItem  = ElementFuncs.isItem(element),
                isSub   = ElementFuncs.isSubMenu(element);
            
            if (!isName || !isItem) {
                element = document.elementFromPoint(position.x, position.y);
                isSub   = ElementFuncs.isSubMenu(element);
                isName  = ElementFuncs.isName(element);
                isItem  = ElementFuncs.isItem(element);
            }
            
            is = {
                name    : isName,
                item    : isItem,
                sub     : isSub,
            };
            
            return is;
        }
        
        function onClick(event, checkResult) {
            var itemData, notClick,
                afterClick  = Options.afterClick,
                beforeClick = Options.beforeClick,
                name        = Options.name,
                
                element     = event.target,
                is          = checkResult || checkElement(element, {
                    x: event.clientX,
                    y: event.clientY
                });
            
            notClick        = Util.exec(beforeClick, name);
            
            if (is.sub) {
                event.preventDefault();
            } else {
                hideMenuElement();
                
                if (!notClick && (is.name || is.item)) {
                    itemData = getMenuItemData(element);
                    Util.exec(itemData);
                    Util.exec(afterClick);
                }
            }
        }
        
        function onContextMenu(event) {
            var element = event.target,
                x       = event.clientX,
                y       = event.clientY,
                is      = checkElement(element, {
                    x: x,
                    y: y
                });
            
            if (is.name || is.item || is.sub)
                onClick(event, is);
            else {
                hideMenuElement();
                showMenuElement(x, y);
            }
            
            event.preventDefault();
        }
        
        function setMenuPosition(x, y) {
            var isNumberX   = Util.type.number(x),
                isNumberY   = Util.type.number(y),
                heightMenu  = getMenuHeight(),
                heightInner = window.innerHeight;
            
            if (heightInner < heightMenu + y)
                y -= heightMenu;
            
            if (isNumberX)
                ElementMenu.style.left  = x + 'px';
            
            if (isNumberY)
                ElementMenu.style.top   = y - 15 + 'px';
        }
        
        function showMenuElement(x, y) {
            var beforeShow  = Options.beforeShow,
                name        = Options.name,
                params      = {
                    x       : x,
                    y       : y,
                    name    : name
                },
                
                notShow     = Util.exec(beforeShow, params);
            
            if (!notShow) {
                ElementMenu.classList.remove('menu-hidden');
                setMenuPosition(params.x, params.y);
            }
        }
        
        function hideMenuElement() {
            var notHide = Util.exec(Options.beforeClose);
            
            if (!notHide)
                ElementMenu.classList.add('menu-hidden');
        }
        
        function getMenuItemData(element) {
            var path, data;
            
            element     = ElementFuncs.getName(element);
            
            if (element) {
                path    = element.getAttribute('data-menu-path');
            }
            
            data        = MenuFuncs[path];
            
            return data;
        }
        
        function getMenuHeight() {
            var styleComputed, height;
            
            if (!ElementHeight) {
                styleComputed   = getComputedStyle(ElementMenu);
                height          = styleComputed.height;
                ElementHeight   = parseInt(height, 10);
            }
                
            return ElementHeight;
        }
        
        init();
    };
    
    function ElementFuncsProto() {
        this.getItem    = getItem;
        this.getName    = getName;
        this.isName     = isName;
        this.isItem     = isItem;
        this.isMenu     = isMenu;
        this.isSubMenu  = isSubMenu;
         
         function getItem(element) {
            var isNameElement;
            
            if (element) {
                isNameElement = isName(element);
                
                if (isNameElement)
                    element = element.parentElement;
            }
            
            return element;
        }
        
        function getName(element) {
            var is;
            
            if (element) {
                is = isName(element);
                
                if (!is)
                    element = element.querySelector('[data-menu-path]');
            }
            
            return element;
        }
        
        function isName(element) {
            var itIs;
            
            if (element)
                itIs = element.hasAttribute('data-menu-path');
            
            return itIs;
        }
        
        function isItem(element) {
            var itIs = checkElementsName(element, 'js-menu-item');
            
            return itIs;
        }
        
        function isMenu(element) {
            var itIs = checkElementsName(element, 'js-menu');
            
            return itIs;
        }
        
        function checkElementsName(element, nameElement, attribute) {
            var itIs, name;
            
            if (!attribute)
                attribute = 'data-name';
            
            if (element) {
                name = element.getAttribute(attribute);
                
                if (name === nameElement)
                    itIs = true;
            }
            
            return itIs;
        }
        
        function isSubMenu(element) {
            var itIs, item,
                attribute   = 'data-menu',
                value       = 'js-submenu';
            
            item    = getItem(element);
            itIs    = checkElementsName(item, value, attribute);
            
            return itIs;
        }
    }
    
    
})(window);
