/**
 * index.js
 * @authors AndyPan (pye-mail@163.com)
 * @date    2017-06-22 10:57:18
 */

'use strict';

window.module = {
	version: '2.0.0',
	isGlobal: true,
	objs: {}
};

//定义模块（模块名不允许重复）
window.define = module.define = function(name, handle){
	var myHandle = function(){
		var result;
		if(handle){
			var exportsObjs = { 
				exports: undefined 
			};
			if(typeof handle === 'function'){
				window.exports = module['exports'] = undefined;
				var res = handle.apply(exportsObjs, arguments);
				result = module['exports'] || exports || exportsObjs.exports || res;
				module['exports'] = exports = undefined;
			}
		}
		return result;
	};
	module.isGlobal ? window[name] = myHandle : module.objs[name] = myHandle;
};

//获取模块
window.require = module.require = module.get = function(){
	var name = arguments[0];
	if(!name)
		return;
	var result, args = [], moduleItem;
	if(Object.prototype.toString.call(name) === "[object Array]"){
		result = [];
		args = arguments[1] || [];
		var i = 0, len = name.length;
		for(;i<len;i++){
			moduleItem = module.isGlobal ? window[name[i]] : module.objs[name[i]];
			if(!moduleItem){
				console.error('Can not find module "'+name[i]+'"!');
				break;
			}
			result.push(moduleItem.apply(module, args[i]));
		}
	}
	else{
		moduleItem = module.isGlobal ? window[name] : module.objs[name];
		if(!moduleItem){
			console.error('Can not find module "'+name+'"!');
			return;
		}
		args = [];
		for(var key in arguments){
			if(key > 0)
				args.push(arguments[key]);
		}
		result = (module.isGlobal ? window[name] : module.objs[name]).apply(module, args);
	}

	return result;
};

//替换所有
String.prototype.replaceAll = function (beRep, rep) {
    /// <summary>替换所有</summary>
    /// <param name="beRep" type="String">被替换字符串</param>
    /// <param name="rep" type="String">替换字符串</param>
    /// <returns type="String" />替换后的字符串

    return this.replace(new RegExp(beRep, "gm"), rep);
};


/**
 * 事件委托
 * @authors AndyPan (pye-mail@163.com)
 * @date    2017-06-26 14:59:05
 *
 * 使用： 	事件委托主要用于给模块代码或者组件自定义事件，当delegates与你的组件或模块结合后，使用者可通过对你的组件或模块的实例进行事件绑定
 * 			该模块对外提供了三个方法
 * 			1.on 添加事件委托(相同name的事件只允许一个存在)
 * 			2.bind 绑定事件委托(相同name的事件允许多个存在)
 * 			3.shift 移除事件监听
 * 示例： 	比如要定义一个组件[mycomps]的render事件，那么在你的组件内部首先引入事件委托模块
 * 			var delegates = require('delegates');
 * 			//定义一个你自己组件内部对象
 * 			var fn = {};
 * 			//并将这个对象传给delegates，用于创建组件自己的事件委托对象
 * 			delegates.call(self, fn);
 *
 * 			然后，在组件render的时候，定义组件的render事件委托
 * 			var result = fn.delegates.fire('render', [参数A， 参数B， 参数C, ...], 事件的this对象, false);
 *
 * 			最后，通过组件的实例绑定render事件
 * 			var case = require('mycomps');
 * 			case.on('render', function(参数A， 参数B， 参数C, ...){  });
 * 			或者使用
 * 			case.bind('render', function(参数A， 参数B， 参数C, ...){  });
 *
 * 			当不需要render事件时
 * 			case.shift('render');
 */

'use strict';


module.define('delegates', function() {

	module.exports = function(childScope, setting){
		
		var self = this;

	    //事件委托对象
	    childScope = childScope || {};
	    childScope.delegates = {};
	    //存储自定义委托对象
	    var customDelegates = {};

	    /**
	     * 添加自定义事件
	     * @param  {String} name 事件名称
	     * @param  {Function} handler 事件函数
	     * @return {Object} 当前实例对象
	     */
	    childScope.delegates.on = function(name, handler) {
	        name = name ? name.toLocaleUpperCase() : null;
	        if (name && handler)
	            customDelegates['on'+name] = [handler];

	        return self;
	    };

	    /**
	     * 绑定自定义事件
	     * @param  {String} name 事件名称
	     * @param  {Function} handler 事件函数
	     * @return {Object} 当前实例对象
	     */
	    childScope.delegates.bind = function(name, handler) {
	        name = name ? name.toLocaleUpperCase() : null;
	        if (name && handler){
	            var key = 'on'+name;
	            customDelegates[key] = customDelegates[key] || [];
	            customDelegates[key].push(handler);
	        }

	        return self;
	    };

	    /**
	     * 触发(执行或响应)已绑定的自定义事件
	     * @param  {String} name 事件名称
	     * @param  {Array} args 需要传递给事件函数的参数集合
	     * @param  {object} posing 以对象冒充的方式替换事件函数this
	     * @return {Object} 事件返回值或当前实例对象
	     */

	    childScope.delegates.fire = function(name, args, posing, async) {
	        name = name ? name.toLocaleUpperCase() : null;
	        var handlerResult;
	        var handler = function(){
	            var handlers = customDelegates['on' + name];
	            if(handlers){
	                var i = 0, len = handlers.length, result;
	                for(; i < len; i++){
	                    result = handlers[i].apply(posing || self, args || []);
	                    if(result != undefined)
	                        handlerResult = result;
	                }
	            }
	        };
	        if(async == false)
	            handler();
	        else
	            setTimeout(handler, 0);

	        return handlerResult;
	    };

	    /**
	     * 移除事件监听
	     * @param  {String} name 事件名称
	     * @param  {Function} handler 事件操作函数
	     * @return {Object} 当前实例对象
	     */
	    childScope.delegates.shift = function(name, handler) {
	        name = name ? name.toLocaleUpperCase() : null;
	        if(name && handler) {
	            var key = 'on' + name;
	            var handlers = customDelegates[key];
	            if(handlers){
	                var i = 0, len = handlers.length;
	                for(; i< len; i++){
	                    if(handler == handlers[i]){
	                        customDelegates[key].splice(i, 1);
	                        break;
	                    }
	                }
	            }
	        }
	        else if(name && !handler)
	            customDelegates['on' + name] = undefined;
	        else if(!name && !handler)
	            customDelegates = {};

	        return self;
	    };

	    /**
	     * 添加组件事件委托(相同name的事件只允许一个存在)
	     * @param  {String} name 委托事件名称
	     * @param  {Function} handler 事件操作函数
	     * @return {Object} 当前实例对象
	     * @remark 相同name的事件只允许一个存在，使用on添加事件会替换原有的使用on绑定的同名事件，并且也会替换使用bind绑定的同名事件
	     */
	    self.on = function(name, handler) {
	        if (handler) {
	            //委托事件
	            childScope.delegates.on(name, handler);
	        } else {
	            //触发事件
	            childScope.delegates.fire(name, null, null);
	        }

	        return self;
	    };

	    /**
	     * 绑定组件事件委托(相同name的事件允许多个存在)
	     * @param  {[type]} name    委托事件名称
	     * @param  {[type]} handler 事件操作函数
	     * @return {[type]}         当前实例对象
	     * @remark 相同name的事件允许多个存在，使用bind绑定的事件不会替换on绑定的同名事件，也不会替换bind绑定的同名事件，允许同名事件有多个操作
	     */
	    self.bind = function(name, handler){
	        if(handler)
	            //委托事件
	            childScope.delegates.bind(name, handler);

	        return self;
	    };

	    /**
	     * 移除事件监听
	     * @param  {String} name 事件名称
	     * @param  {Function} handler 事件操作函数
	     * @return {Object} 当前实例对象
	     */
	    self.shift = function(name, handler) {
	        return childScope.delegates.shift(name, handler);
	    };
	};
});



/**
 * 异步操作
 * @authors AndyPan (pye-mail@163.com)
 * @date    2017-06-23 18:17:26
 * 
 * 使用：	var async = require('async');
 * 			async.ajax([jquery ajax 参数对象]).then(function(res){
 * 				//ajax请求成功回调
 * 			}).catch(function(res){
 * 				//ajax请求失败回调
 * 			}).finally(function(res){
 * 				//不管成功或失败都会被调用
 * 			});
 */

'use strict';

module.define('async', function(){

	var self = this;

	var renderTCF = function(objs, response, responseText){
        var i=0, len = objs.length, objItem;
        for(;i<len;i++){
            objItem = objs[i];
            if(objItem && typeof(objItem) == 'function')
                objItem.call(self, response, responseText);
        }
	};

	self.ajax = function(opts){

		var customThen = [],
			customCatch = [],
			customFinally = [];
		var defaults = {};
		var options = $.extend(true, {}, defaults, opts || {});

		options.success = function(response, responseText){
			if(opts.success)
				opts.success(response, responseText);
            renderTCF(customThen, response, responseText);
            renderTCF(customFinally, response, responseText);
		};
		options.error = function(response, responseText){
			if(opts.error)
				opts.error(response, responseText);
            renderTCF(customCatch, response, responseText);
            renderTCF(customFinally, response, responseText);
		};
		var ajaxObj = $.ajax(options);

		return {
			ajaxObj: ajaxObj,
			then: function(fun){
				if(fun)
	                customThen.push(fun);
	            return this;
			},
			catch: function(fun){
				if(fun)
                	customCatch.push(fun);
            	return this;
			},
			finally: function(fun){
				if(fun)
                	customFinally.push(fun);
            	return this;
			}
		}
	};

	module.exports = self;

});


/**
 * iframe和异步加载管理
 * @authors 潘毅 (pye-mail@163.com)
 * @date    18-03-08 14:22:15
 */

define('CompLoadManager', function(options){

    //视图引用
    var views = require('ViewCompLoadManager');
    //事件委托
    var delegates = require('delegates');
    //异步请求
    var async = require('async');

    //定义当前对应，用于存储对外方法
    var self = this;
    //组件默认参数或组件内部全局变量
    var defaults = {}, fn = {};
    //默认参数与自定义参数合并后的参数对象
    var setting = jQuery.extend(true, {}, defaults, options || {});
    //事件委托
    delegates.call(self, fn);

    //定义当前对应，用于存储对外方法
    var self = this;
    //组件默认参数或组件内部全局变量
    var defaults = {
    	target: '',
    	content: '',
    	dataIframe: '',
    	dataAsync: '',
    	refresh: false,
    	//缓存对象
    	cache: {}
    }, fn = {};
    //默认参数与自定义参数合并后的参数对象
    var setting = jQuery.extend(true, {}, defaults, options || {});
    //事件委托
    delegates.call(self, fn);

    //组件初始化
    var install = function(){
        //初始化状态
        initState();
        //(如果组件有操作事件)绑定组件事件
        bindEvent();
    };

    //初始化参数状态
    var initState = function(){
        //重置view中的target
        views.target = $(setting.target || views.target);
    };

    //组件事件绑定
    var bindEvent = function(){
        //do something
    };

    var onLoad = function(e, res, callBack){
    	var target = setting.target;
    	if(res){
    		target.html(res);
    	}
    	//设置加载完成
    	target.attr(views.attr.dataLoaded, true);
    	//清空缓存
    	setting.cache.iframe = undefined;
    	setting.cache.async = undefined;
    	if(callBack)
    		callBack.call(target);
    	fn.delegates.fire('loaded', [], target, true);
    };

    //将内容加载到指定容器
    self.loadTo = function(target, options, callBack){
    	var dataIframe = options.dataIframe,
            dataAsync = options.dataAsync,
            refresh = options.refresh;

        setting.target = target;

        var dataLoaded = target.attr(views.attr.dataLoaded);

        var selfFn = function(){
        	if(dataIframe){
        		var iframeTarget = $(views.html.iframe.replace('#URL#', dataIframe));
        		//设置缓存iframe对象
        		setting.cache.iframe = iframeTarget;
	            iframeTarget.load(function(e){onLoad(e, undefined, callBack);});
	            target.html('');
	            target.append(iframeTarget);
        	}
        	else if(dataAsync){
	        	var asyncObj = async.ajax({
	        		url: dataAsync,
	        		type: 'GET'
	        	}).then(function(res){
	        		onLoad({}, res, callBack);
	        	});
	        	//设置缓存async对象
	        	setting.cache.async = asyncObj.ajaxObj;
	        }
        };

    	if(dataLoaded == 'true'){
    		if((refresh == 'true' || refresh == true)){
    			selfFn();
    		}
    	}
    	else{
            selfFn();
        }
    };

    //中止操作
    self.abort = function(callBack){
    	var iframeTarget = setting.cache.iframe;
    	var asyncObj = setting.cache.async;
    	if(iframeTarget)
    		iframeTarget.remove();
    	if(asyncObj)
    		asyncObj.abort();
    	if(callBack)
    		callBack.call(setting.target);
    	fn.delegates.fire('abort', [], setting.target, true);
    };

    //初始化执行
    install();
    
    //组件方法输出
    module.exports = self;

});

/**
 * iframe和异步加载管理 View
 * @authors 潘毅 (pye-mail@163.com)
 * @date    18-03-08 14:29:19
 */

define('ViewCompLoadManager', function(){

	exports = {
    	//组件所需要的视图目标元素
    	target: '',
    	//组件所需要的视图类名集合对象
    	className: {},
        //元素属性
        attr: {
            //是否加载完成
            dataLoaded: 'data-loaded'
        },
    	//组件所需要的html字符串集合对象
    	html: {
    		//iframe
    		iframe: '<iframe src="#URL#"></iframe>'
    	},
    	//组件所需要的html渲染函数
    	render: function(){}
	};

});

/**
 * 选项卡组件
 * @authors 潘毅 (pye-mail@163.com)
 * @date    18-03-07 18:08:32
 */


'use strict';

/**
 * CompTabs(组件)
 * @param  {Object} options配置参数对象
 * @return {Object} 对外接口方法
 */
define('CompTabs', function(options){

    //视图引用
    var views = require('ViewCompTabs');
    //事件委托
    var delegates = require('delegates');
    //iframe和异步加载管理
    var loadManager = require('CompLoadManager');

    //定义当前对应，用于存储对外方法
    var self = this;
    //组件默认参数或组件内部全局变量
    var defaults = {
        //目标元素
        target: '',
        //是否组件自己创建结构
        isSelfCreate: true,
        //如果是组建自己创建结构，那么需要传入的数据集合
        data: [
            //描述：{ 
            //          title: '每一个选项卡的文本', 
            //          content: '选项卡对应的文本内容', 
            //          iframe: '选项卡对应的iframe', 
            //          async: '选项卡对应的异步请求', 
            //          active: 是否默认选中, 
            //          disabled: 是否被禁用,
            //          refresh: 是否每次切换都刷新内容(只有设置iframe和async时有效)
            //      }
            //注意：content、iframe、ajax三者只能存在一个，即是三种不同的选项卡内容的展示方式
            /*{ title: '选项A', content: '文本内容A', iframe: 'http://www.baidu.com/', async: '' },
            { title: '选项B', content: '文本内容B', iframe: '', async: 'html/test.html', active: true },
            { title: '选项C', content: '文本内容C', iframe: '', async: '', disabled: true }*/
        ]
    }, fn = {};
    //默认参数与自定义参数合并后的参数对象
    var setting = jQuery.extend(true, {}, defaults, options || {});
    //事件委托
    delegates.call(self, fn);


    //组件初始化
    var install = function(){
        //初始化状态
        initState();
        //(如果组价有操作事件)绑定组件事件
        bindEvent();
        //组件render事件
        fn.delegates.fire('render', [], self, true);
    };

    //初始化默认选中
    var initDefaultActive = function(elem, triggerMode){
        var data = setting.data;

        var selfFn = function(idx){
            if(triggerMode.toLowerCase() == 'hover')
                elem.find('.'+views.className.tabHdItem).eq(idx).mouseover();
            else
                elem.find('.'+views.className.tabHdItem).eq(idx).click();
        }

        var i = 0, len = data.length, item, status = 0;
        for(;i<len;i++){
            item = data[i];
            if(item.active){
                selfFn(i);
                status = 1;
                break;
            }
        }
        if(!status)
            selfFn(0);
    };

    //初始化参数状态
    var initState = function(){
        //重置view中的target
        views.target = $(setting.target || views.target);
        if(setting.isSelfCreate){
            views.target.html(views.render(setting.data));
        }
    };

    //组件事件绑定
    var bindEvent = function(){
        var attr = views.attr;
        var target = views.target;

        target.each(function(idx, elem){
            elem = $(elem);
            var triggerMode = elem.attr(attr.triggerMode) || '';
            if(triggerMode.toLowerCase() == 'hover')
                bindTabHover(elem);
            else
                bindTabClick(elem);
            initDefaultActive(elem, triggerMode);
        });
    };

    //绑定hover事件
    var bindTabHover = function(target){
        target.on('mouseover', '.'+views.className.tabHdItem, tabSwitch);
    };

    //绑定click事件
    var bindTabClick = function(target){
        target.on('click', '.'+views.className.tabHdItem, tabSwitch);
    };

    //切换操作
    var tabSwitch = function(e){
        var target = $(this);
        var className = views.className;
        if(target.hasClass(className.disabled)){
            return;
        }
        var idx = target.index();

        var components = target.parents('.'+className.tab).eq(0);
        var tabContItems = components.find('.'+className.tabContItem);
        var thisItem = tabContItems.eq(idx);

        if(thisItem.length){
            //切换前选中项
            var tagSiblings = target.siblings(), prevTarget;
            var i = 0, len = tagSiblings.length, item;
            for(;i<len;i++){
                item = tagSiblings.eq(i);
                if(item.hasClass(className.active)){
                    prevTarget = item;
                    break;
                }
            }
            if(prevTarget){
                if(prevTarget.get(0) == target.get(0)){
                    return false;
                }
            }
            //切换前选中内容
            var prevContItem, contItem;
            i = 0, len = tabContItems.length;
            for(;i<len;i++){
                contItem = tabContItems.eq(i);
                if(contItem.hasClass(className.active)){
                    prevContItem = contItem;
                    break;
                }
            }
            //响应switch事件
            var result = fn.delegates.fire('switch', [target, thisItem, idx, [prevTarget, prevContItem]], self, true);
            if(result == false){ return false; }

            //处理内容加载之前，先关闭上一次未完成的加载(前提：如果是异步或iframe方式，且加载未完成)
            loadManager.abort();
            //处理内容加载
            loadContent(thisItem);

            //选中tabItem
            if(prevTarget)
                prevTarget.removeClass(className.active);
            target.addClass(className.active);
            //选中tab内容
            if(prevContItem)
                prevContItem.removeClass(className.active);
            thisItem.addClass(className.active);
        }
        else{
            alert('Not Found！');
        }
    };

    //处理内容加载
    var loadContent = function(thisItem){
        var attrs = views.attr;
        var dataIframe = thisItem.attr(attrs.dataIframe),
            dataAsync = thisItem.attr(attrs.dataAsync),
            refresh = thisItem.attr(attrs.dataRefresh);

        loadManager.loadTo(thisItem, {
            dataIframe: dataIframe, 
            dataAsync: dataAsync,
            refresh: refresh
        });
    };

    //初始化执行
    install();
    
    
    //组件方法输出
    module.exports = self;
    
});

/**
 * Tabs 视图业务逻辑
 * @authors 潘毅 (pye-mail@163.com)
 * @date    18-03-08 09:57:48
 */

define('ViewCompTabs', function(){

	//组件视图输出
    module.exports = {
    	//组件所需要的视图目标元素
    	target: $('.j-tabs'),
    	//组件所需要的视图类名集合对象
    	className: {
    		//tab项选中class
    		active: 'active',
    		//tab项disabled
    		disabled: 'disabled',
    		//tab模块
    		tab: 'j-tabs',
    		//tab头部选项
    		tabHdItem: 'j-tabs-hd-item',
    		//tab内容项
    		tabContItem: 'j-tabs-cont-item',
    	},
    	//组件相关操作属性
    	attr: {
    		//触发tab切换方式
    		triggerMode: 'data-trigger-mode',
    		//data-iframe
    		dataIframe: 'data-iframe',
    		//data-async
    		dataAsync: 'data-async',
    		//data-refresh
    		dataRefresh: 'data-refresh'
    	},
    	//默认提示文本
    	tipStr: {
    		noTitle: '未设置Title',
    		noContent: '暂无内容！'
    	},
    	//组件所需要的html字符串集合对象
    	html: {
    		//选项卡选项标签
    		tabsHdItem: '<a href="javascript:;" class="tabs-hd-item j-tabs-hd-item #DISABLED#">#ITEMTEXT#</a>',
    		//选项卡内容容器
    		tabsBdItem: '<div class="tabs-bd-item j-tabs-cont-item #ISIFRAME#" data-iframe="#DATAIFRAME#" data-async="#DATAASYNC#" data-refresh="#DATAREFRESH#">#ITEMCONT#</div>',
    	},
    	//组件所需要的html渲染函数
    	render: function(data){
    		data = data || [];

    		var html = [], tabsHdItems = [], tabsBdItems = [];
    		var i = 0, len = data.length, item;
    		for(;i<len;i++){
    			item = data[i];
    			tabsHdItems.push(
    				this.html.tabsHdItem
    					.replace('#ITEMTEXT#', item.title || this.tipStr.noTitle)
    					.replace('#DISABLED#', item.disabled ? (typeof(item.disabled) === 'string' ? item.disabled : this.className.disabled) : '')
				);
    			tabsBdItems.push(
					this.html.tabsBdItem
						.replace('#ITEMCONT#', item.content || this.tipStr.noContent)
						.replace('#DATAIFRAME#', item.iframe || '')
						.replace('#DATAASYNC#', item.async || '')
						.replace('#DATAREFRESH#', item.refresh || '')
						.replace('#ISIFRAME#', item.iframe ? 'iframe' : '')
				);
    		}

    		html.push('<div class="ui-tabs j-tabs">');
            html.push('    <div class="ui-tabs-hd">');
            html.push(tabsHdItems.join('\r\n'));
            html.push('    </div>');
            html.push('    <div class="ui-tabs-bd">');
            html.push(tabsBdItems.join('\r\n'));
            html.push('    </div>');
            html.push('</div>');

            return html.join('\r\n');
    	}
    };

});

/**
 * 组件化 DEMO - 组件业务逻辑JS
 * @authors AndyPan (pye-mail@163.com)
 * @date    2017年10月23日14:00:28
 */

'use strict';

define('CompDemo', function(options){

    //视图引用
    var views = require('ViewCompDemo');
    //事件委托
    var delegates = require('delegates');
    //其他组件引用
    //var other = require('other');

    //定义当前对应，用于存储对外方法
    var self = this;
    //组件默认参数或组件内部全局变量
    var defaults = {}, fn = {};
    //默认参数与自定义参数合并后的参数对象
    var setting = jQuery.extend(true, {}, defaults, options || {});
    //事件委托
    delegates.call(self, fn);

    //组件初始化
    var install = function(){
        //初始化状态
        initState();
        //(如果组件有操作事件)绑定组件事件
        bindEvent();
        //组件render事件
        fn.delegates.fire('render', [], self, true);
        //do something
    };

    //初始化参数状态
    var initState = function(){
        //重置view中的target
        views.target = $(setting.target || views.target);
    };

    //组件事件绑定
    var bindEvent = function(){
        //do something
    };

    //提供外部访问的方法
    self['外部访问函数名'] = function(){};

    //初始化执行
    install();
    
    //组件方法输出
    module.exports = self;
    
});


/**
 * 组件化 DEMO View - 组件DOM操作、渲染、获取等
 * @authors AndyPan (pye-mail@163.com)
 * @date 2017年10月23日14:06:10
 */

'use strict';

module.define('ViewCompDemo', function(){

	//组件视图输出
    module.exports = {
    	//组件所需要的视图目标元素
    	target: $('selector'),
    	//组件所需要的视图类名集合对象
    	className: {},
    	//组件所需要的html字符串集合对象
    	html: {},
    	//组件所需要的html渲染函数
    	render: function(){}
    };

});

