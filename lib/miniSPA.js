//The following code structure is mandatory
var home = {};            //default partial page, which will be loaded initially
home.partial = "lib/home.html";
home.init = function(){   //bootstrap method
    //nothing but static content only to render
}

var notfound = {};               //404 page
notfound.partial = "lib/404.html";
notfound.init = function(){
    alert('URL does not exist. please check your code. You may also try manually inputing some other invalid url to get here.');
}

var settings = {};               //global parameters
settings.partialCache = {};      //cache for partial pages
settings.divDemo = document.getElementById("demo");      //div for loading partials

var miniSPA = {};

miniSPA.render = function(url){
    settings.rootScope = window[url];
    miniSPA.refresh(settings.divDemo, settings.rootScope);
}

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

miniSPA.initFunc = function(partial) {                            //execute the controller function responsible for current template
    var fn = window[partial].init;
    if(typeof fn === 'function') {
        fn();
    }
}

miniSPA.ajaxRequest('lib/404.html', 'GET','',function(status, partial){
    settings.partialCache.notfound = partial;
});        //cache 404 page first

