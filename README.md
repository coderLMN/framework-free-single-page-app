# 开发无框架单页面应用 -- 老码农的祖传秘方
#

##什么是单页面应用（SPA）？
[维基百科上的描述](http://en.wikipedia.org/wiki/Single-page_application )是这样的：
```
“A single-page application (SPA), is a web application or web site
that fits on a single web page with the goal of providing a more
fluid user experience akin to a desktop application.”
```
也就是说，单页面应用是仅包含单个网页的应用，目的是为了提供类似于本地应用的流畅用户体验。

##需不需要框架？
要实现单页面应用，现在已经有很多现成的框架了，比如`AngularJS`, `Ember.js`, `Backbone.js`等等。它们都是很全面的开发平台，为单页面应用开发提供了必需的页面模板、路径解析和处理、后台服务api访问、DOM操作等功能。

事实上，现代的web应用开发基本都离不开一个甚至多个框架，开发无框架应用的想法听起来蛮不靠谱的，对吧？

但是我总觉得现在是时候抛弃框架了。前两年我都在用 `AngularJS` 做开发，可以说已经比较熟悉它了，我的第一个单页面应用就是在 `AngularJS` 的启发下做出来的。框架曾经是我的挚爱。

但是现在每次看着它们那庞大臃肿的身躯和晦涩的语法，我都会想到诸葛亮的那句名言：`“好累，感觉不会再爱了”`。还有不同框架下各种工具、插件难以混用的现状，让我不得不经常需要自己写原生代码解决很多问题。时间长了，我自然冒出一个想法：“为啥不干脆抛弃框架，直接写原生代码呢？毕竟，框架也是原生代码写出来的嘛。”

##怎么实现无框架SPA？
在微博里表达了这个想法之后，有不少朋友提出了各种意见和建议，我非常感谢。其中还有个小朋友评论道：`“我看到了一个从大型机到web的大叔，在抠性能[偷笑]这是职业病嘛。”`。看到这条评论，我含笑不语。

这种职业病在我们从90年代过来的老码农里还是比较普遍的，当年内存64K，磁盘360K，必须精打细算才能过日子。1个byte要掰成2个4位用，链表要自己实现，每一K内存里放了啥都门清。后来工作了，在ES/9000上做开发，系统资源也是非常金贵的。

记得有一次我们单位因为某个数据库应用系统吃内存太厉害，找IBM加了128M内存，一下子就花了60多万人民币，60多万哪！当时我的心在滴血：“把钱给我一半，我帮你们优化一下，省下这些内存行不？”。后来有机会瞻仰了一下那个系统的代码，我滴个妈呀，无数的join操作，当时骂娘的心都有了，但代码是我们部门一位元老写的，我一个新来的菜鸟惹不起...

总之，那时写代码是艺术，现在有的同学动不动就把一堆东西全load到内存里，反正内存不够了就加，这不是败家子么！哼！（老码农倚老卖老，不能算新闻）

好了，一不小心扯远了，还是说单页面应用的事情。

总之，无框架单页面应用看似可行，但难度有多大？我还是心里没底，需要一点理论依据给自己壮胆。所以我就在网上到处寻摸了一番，偶然找到了这篇 Google 工程师 Joe Gregorio 写的文章[《别再用JS框架了》](http://coderlmn.github.io/frontEndCourse/nomoreJSF.html )，里面的分析有一种与我心有戚戚的感觉，看完还给它翻译成中文了。

不过，他提出的方法是更超前的，例如 `imports` 和 `Polymer`，我曾经试过，印象中只有 Google 的 Chrome Canary 才有支持，而且要先在选项中打开一些试验功能，浏览器会变得不那么稳定。`X-Tag` 和 `Bosonic` 也要依赖于一个小的库。而我想做的是现在的浏览器就已经能支持的功能，用原生代码来实现。所以他这篇文章只能让我坚定方向，但是具体的做法还得靠自己去发现。

后来又看了几篇比较偏学术的文章，例如这篇 Mixu 写的[《Single page apps in depth》](http://singlepageappbook.com/single-page.html )，对我也不太适用。他的模板都需要先编译为JS对象存放，和 AngularJS 的方法类似，但我觉得在一个小规模应用里应该有更加优雅的实现方法。

找了好几天文档，我突然意识到自己浪费了不少时间。所谓理论依据应该是高层次的，解决可行性的问题，剩下的就是自己去想办法实现了。可行性不是明摆着的嘛，那么多框架不也是用原生代码实现的么？

想到这儿，我就开始自己尝试了。前后一共只花了两三天时间，写出来一共一两百行JS，就基本解决了问题。其实把代码写完了回顾一下，这些方法都算不上什么创新，都是标准的东西而已。肯定有别人也这么做了，只是我不知道而已吧。

可能有读者看到这儿不耐烦了：`“Talk is cheap. Show me the code.”` 好吧，下面就是代码的描述。

##老码农的实现方法

###基础对象
首先是定义缺省的两个页面片段（缺省页面和出错页面，这两个页面是基础功能，所以放在库里）相关代码，对每个片段对应的url（例如 `home`）定义一个同名的对象，里面存放了对应的 html 片段文件路径、初始化方法。
```javascript
var home = {};            //default partial page, which will be loaded initially
home.partial = "lib/home.html";
home.init = function(){   //bootstrap method
                          //nothing but static content only to render
}

var notfound = {};               //404 page
notfound.partial = "lib/404.html";
notfound.init = function(){
    alert('URL does not exist. please check your code.');
}
```

随后是全局变量，包含了 html 片段代码的缓存、局部刷新所在 div 的 DOM 对象和向后端服务请求返回的根数据（`rootScope`，初始化时未出现，在后面的方法中才会用到）：
```javascript
var settings = {};               //global parameters
settings.partialCache = {};      //cache for partial pages
settings.divDemo = document.getElementById("demo");      //div for loading partials, defined in index.html
```

###主程序
下面就是主程序了，所有的公用方法打包放到一个对象 `miniSPA` 中，这样可以避免污染命名空间：
```javascript
// Main Object here
var miniSPA = {};
```

然后是 changeUrl 方法，对应在 `index.html` 中有如下触发定义：
```html
<body onhashchange="miniSPA.changeUrl();">
```

`onhashchange` 是在location.hash发生改变的时候触发的事件，能够通过它获取局部 url 的改变。在 `index.html` 中定义了如下的链接：
```html
	<h1> Demo Contents:</h1>
    <a href="#home">Home (Default)</a>
    <a href="#postMD">POST request</a>
    <a href="#getEmoji">GET request</a>
    <a href="#wrong">Invalid url</a>
    <div id="demo"></div>
```

每个 url 都以 `#` 号开头，这样就能被 `onhashchange` 事件抓取到。最后的 div 就是局部刷新的 html 片段嵌入的位置。
```javascript
miniSPA.changeUrl = function() {          //handle url change
    var url = location.hash.replace('#','');
    if(url === ''){
        url = 'home';           //default page
    }
    if(! window[url]){
        url = "notfound";
    }
    miniSPA.ajaxRequest(window[url].partial, 'GET', '',function(status, page){
        if(status == 404){
            url = 'notfound';       //404 page
            miniSPA.ajaxRequest(window[url].partial,'GET','',function(status, page404){
                settings.divDemo.innerHTML = page404;
                miniSPA.initFunc(url);              //load 404 controller
            });
        }
        else{
            settings.divDemo.innerHTML = page;
            miniSPA.initFunc(url);              //load url controller
        }
    });
}
```
上面的代码先获取改变后的 url，先通过 `window[url]` 找到对应的对象（类似于最上部定义的 `home` 和 `notfound`），如对象不存在（无定义的路径）则转到 `404` 处理，否则通过 `ajaxRequest` 方法获取 `window[url].partial` 中定义的 html 片段并加载到局部刷新的div，并执行 `window[url].init` 初始化方法。

`ajaxRequest` 方法主要是和后端的服务进行交互，通过 `XMLHttpRequest` 发送请求（ `GET` 或 `POST`），如果获取的是 html 片段就把它缓存到 `settings.partialCache[url]` 里，因为 html 片段是相对固定的，每次请求返回的内容不会变化。如果是其他请求（比如向 Github 的 markdown 服务 POST 一个字符串）就不能缓存了。
```javascript
miniSPA.ajaxRequest = function(url, method, data, callback) {    //load partial page
    if(settings.partialCache[url]){
        callback(200, settings.partialCache[url]);
    }
    else {
        var xmlhttp;
        if(window.XMLHttpRequest){
            xmlhttp = new XMLHttpRequest();
            xmlhttp.open(method, url, true);
            if(method === 'POST'){
                xmlhttp.setRequestHeader("Content-type","application/x-www-form-urlencoded");
            }
            xmlhttp.send(data);
            xmlhttp.onreadystatechange = function(){
                if(xmlhttp.readyState == 4){
                    switch(xmlhttp.status) {
                        case 404:                             //if the url is invalid, show the 404 page
                            url = 'notfound';
                            break;
                        default:
                            var parts = url.split('.');
                            if(parts.length>1 && parts[parts.length-1] == 'html'){         //only cache static html pages
                                settings.partialCache[url] = xmlhttp.responseText;        //cache partials to improve performance
                            }
                    }
                    callback(xmlhttp.status, xmlhttp.responseText);
                }
            }
        }
        else{
            alert('Sorry, your browser is too old to run this app.')
            callback(404, {});
        }
    }
}
```
对于不支持 `XMLHttpRequest` 的浏览器（主要是 IE 老版本），本来是可以在 else 里加上 **xmlhttp = new ActiveXObject('Microsoft.XMLHTTP');** 的，不过，我手头也没有那么多老版本 IE 用于测试，而且老版本 IE 本来就是我深恶痛绝的东西，凭什么要支持它啊？所以就干脆直接给个 `alert` 完事。


`render` 方法一般在每个片段的初始化方法中调用，它会设定全局变量中的根对象，并通过 `refresh` 方法渲染 html 片段。
```javascript
miniSPA.render = function(url){
    settings.rootScope = window[url];
    miniSPA.refresh(settings.divDemo, settings.rootScope);
}
```

获取后端数据后，如何渲染 html 片段是个比较复杂的问题。这就是 DOM 操作了。总体思想就是从 html 片段的根部入手，遍历 DOM 树，逐个替换属性和文本中的占位变量（例如`<img src="emojis.value">` 和 `<p>{{emojis.key}}</p>`），匹配和替换是在 `feedData()` 方法中完成的。

对于 img 元素，src 属性一开始是未知的，也不能直接把变量定义到它里面，不然浏览器会报404错误，虽然不影响用户使用，但对于代码来说总归是不好看的。所以需要在获取了 `data-src` 属性值后再复制到 src 中去，这样一开始 `src` 属性是空的，就不会报错了。

这里最麻烦的是 `data-repeat` 属性，这是为了批量渲染格式相同的一组元素用的。比如从 Github 获取了全套的 emoji 表情，共计 888 个（也许下次升级到1000个），就需要渲染 888 个元素，把 888 个图片及其说明放到 html 片段中去。而 html 片段中对此只有一条定义：

```html
	<ul>
        <li data-repeat="emojis" data-item="data">
            <figure>
                <img data-src='{{data.value}}' width='100' height='100'>
                <figcaption>{{data.key}}</figcaption>
            </figure>
        </li>
    </ul>
```
等 888 个 emoji 表情来了之后，就要自动把 `<li>` 元素扩展到 888 个。这就需要先 `clone` 定义好的元素，然后根据后台返回的数据逐个替换元素中的占位变量。
```javascript
miniSPA.refresh = function(node, scope) {
    var children = node.childNodes;
    if(node.nodeType != 3){                            //traverse child nodes, Node.TEXT_NODE == 3
        for(var k=0; k<node.attributes.length; k++){
            node.setAttribute(node.attributes[k].name, miniSPA.feedData(node.attributes[k].value, scope));       //replace variables defined in attributes
        }
        if(node.hasAttribute('data-src')){
            node.setAttribute('src',node.getAttribute('data-src'));             //replace src attribute
        }
        var childrenCount = children.length;
        for(var j=0; j<childrenCount; j++){
            if(children[j].nodeType != 3 && children[j].hasAttribute('data-repeat')){     //handle repeat items
                var item = children[j].dataset.item;
                var repeat = children[j].dataset.repeat;
                children[j].removeAttribute('data-repeat');
                var repeatNode = children[j];
                for(var prop in scope[repeat]){
                    repeatNode = children[j].cloneNode(true);                  //clone sibling nodes for the repeated node
                    node.appendChild(repeatNode);
                    var repeatScope = scope;
                    var obj = {};
                    obj.key = prop;
                    obj.value = scope[repeat][prop];                           //add the key/value pair to current scope
                    repeatScope[item] = obj;
                    miniSPA.refresh(repeatNode,repeatScope);                           //iterate over all the cloned nodes
                }
                node.removeChild(children[j]);                                 //remove the empty template node
            }
            else{
                miniSPA.refresh(children[j],scope);                                    //not for repeating, just iterate the child node
            }
        }
    }
    else{
        node.textContent = miniSPA.feedData(node.textContent, scope);           //replace variables defined in the template
    }
}
```
从上面的代码可以看到，`refresh` 方法是一个递归执行的函数，每次处理当前 node 之后，还会递归处理所有的孩子节点。通过这种方式，就能把模板中定义的所有元素的占位变量都替换为真实数据。


`feedData` 用来替换文本节点中的占位变量。它通过正则表达式获取`{{...}}`中的内容，并把多级属性（例如 `data.map.value`）切分开，逐级循环处理，直到最底层获得相应的数据。
```javascript
miniSPA.feedData = function(template, scope){                                     //replace variables with data in current scope
    return template.replace(/\{\{([^}]+)\}\}/gmi, function(model){
        var properties = model.substring(2,model.length-2).split('.');          //split all levels of properties
        var result = scope;
        for(var n in properties){
            if(result){
                switch(properties[n]){                  //move down to the deserved value
                    case 'key':
                        result = result.key;
                        break;
                    case 'value':
                        result = result.value;
                        break;
                    case 'length':                     //get length from the object
                        var length = 0;
                        for(var x in result) length ++;
                        result = length;
                        break;
                    default:
                        result = result[properties[n]];
                }
            }
        }
        return result;
    });
}
```

`initFunc` 方法的作用是解析片段对应的初始化方法，判断其类型是否为函数，并执行它。这个方法是在 `changeUrl` 方法里调用的，每次访问路径的变化都会触发相应的初始化方法。
```javascript
miniSPA.initFunc = function(partial) {                            //execute the controller function responsible for current template
    var fn = window[partial].init;
    if(typeof fn === 'function') {
        fn();
    }
}
```

最后是 `miniSPA` 库自身的初始化。很简单，就是先获取 `404.html` 片段并缓存到 `settings.partialCache.notfound` 中，以便在路径变化时使用。当路径不合法时，就会从缓存中取出404片段并显示在局部刷新的 div 中。
```javascript
miniSPA.ajaxRequest('lib/404.html', 'GET','',function(status, partial){
    settings.partialCache.notfound = partial;
});        //cache 404 page first
```

好了，核心的代码就是这么多。整个 js 文件才区区 155 行，比起那些动辄几万行的框架是不是简单得不能再简单了？

有了上面的 `miniSPA.js` 代码以及配套的 `404.html` 和 `home.html`，并把它们打包放在 `lib` 目录下，下面就可以来看我的应用里有啥内容。

###应用代码
说到应用那就更简单了，`app.js` 一共30行，实现了一个 `GET` 和一个 `POST` 访问。

首先是 `getEmoji` 对象，定义了一个 html 片段文件路径和一个初始化方法。初始化方法中分别调用了 `miniSPA` 中的 `ajaxRequest` 方法（用于获取 Github API 提供的 emoji 表情数据， JSON格式）和 `render` 方法（用来渲染对应的 html 片段）。
```javascript
var getEmoji = {};
getEmoji.partial = "getEmoji.html"
getEmoji.init = function(){
    document.getElementById('spinner').style.visibility = 'visible';
    document.getElementById('content').style.visibility = 'hidden';
    miniSPA.ajaxRequest('https://api.github.com/emojis','GET','',function(status, partial){
        getEmoji.emojis = JSON.parse(partial);
        miniSPA.render('getEmoji');         //render related partial page with data returned from the server
        document.getElementById('content').style.visibility = 'visible';
        document.getElementById('spinner').style.visibility = 'hidden';
    });
}
```

然后是 `postMD` 对象，它除了 html 片段文件路径和初始化方法（因为初始化不需要获取外部数据，所以只需要调用 `render` 方法就可以了）之外，重点在于 `submit` 方法。`submit` 会把用户提交的输入文本和其他两个选项打包 POST 给 Github 的 markdown API，并获取后台解析标记返回的 html。
```javascript
var postMD = {};
postMD.partial = "postMD.html";
postMD.init = function(){
    miniSPA.render('postMD');               //render related partial page
}
postMD.submit = function(){
    document.getElementById('spinner').style.visibility = 'visible';
    var mdText = document.getElementById('mdText');
    var md = document.getElementById('md');
    var data = '{"text":"'+mdText.value.replace(/\n/g, '<br>')+'","mode": "gfm","context": "github/gollum"}';
    miniSPA.ajaxRequest('https://api.github.com/markdown', 'POST', data,function(status, page){
        document.getElementById('spinner').style.visibility = 'hidden';
        md.innerHTML = page;                //render markdown partial returned from the server
    });
    mdText.value = '';
}
miniSPA.changeUrl();                        //initialize
```

这两个对象对应的 html 片段如下：

getEmoji.html :
```html
<h2>GET request: Fetch emojis from Github pulic API.</h2>
<p> This is a list of emojis get from https://api.github.com/emojis: </p>
<i id="spinner" class="csspinner duo"></i>
<span id="content">
    <h4>Get <strong class="highlight">{{emojis.length}}</strong> items totally.</h4>
    <hr>
    <ul>
        <li data-repeat="emojis" data-item="data">
            <figure>
                <img data-src='{{data.value}}' width='100' height='100'>
                <figcaption>{{data.key}}</figcaption>
            </figure>
        </li>
    </ul>
</span>
```

postMD.html :
```html
<h2> POST request: send MD text and get rendered HTML</h2>
<p> markdown text here (for example:  <strong>Hello world github/linguist#1 **cool**, and #1! </strong>): </p>
<textarea id="mdText" cols="80" rows="6"></textarea>
<button onclick="postMD.submit();">submit</button>
<hr>
<h4>Rendered elements from Github API (https://api.github.com/markdown):</h4>
<i id="spinner" class="csspinner duo"></i>
<div id="md"></div>
```


##演示地址
以上代码的在线演示可以在 [我的 Github 项目页面](https://coderlmn.github.io/framework-free-single-page-app/ ) 看到。

以上演示代码已经在 `Chrome`, `Firefox`, `Safari` 和 `Opera` 较新版本上测试过。`IE 9` 以上版本估计也可以，不过没测过。

另外，这些代码还有不少值得优化的地方，不过时间有限，主要是为了达到演示目的，所以暂时就不去改它了。
