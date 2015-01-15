//The following is customizable, and consistent to the templates used
var postMD = {};
postMD.exec = function(){
    render('postMD');             //render related partial page
}
postMD.submit = function(){
    document.getElementById('spinner').style.visibility = 'visible';
    var mdText = document.getElementById('mdText');
    var md = document.getElementById('md');
    var data = '{"text":"'+mdText.value.replace(/\n/g, '<br>')+'","mode": "gfm","context": "github/gollum"}';
    ajaxRequest('https://api.github.com/markdown', 'POST', data,function(status, page){
        document.getElementById('spinner').style.visibility = 'hidden';
        md.innerHTML = page;     //render markdown partial returned from the server
    });
    mdText.value = '';
}

var getEmoji = {};
getEmoji.exec = function(){
    document.getElementById('spinner').style.visibility = 'visible';
    document.getElementById('content').style.visibility = 'hidden';
    ajaxRequest('https://api.github.com/emojis','GET','',function(status, partial){
        getEmoji.emojis = JSON.parse(partial);
        render('getEmoji');       //render related partial page with data returned from the server
        document.getElementById('content').style.visibility = 'visible';
        document.getElementById('spinner').style.visibility = 'hidden';
    });
}

//The following code structure is mandatory
var home = {};            //default partial page, which will be loaded initially
home.exec = function(){   //bootstrap method
                          //nothing but static content only to render
}

var notfound = {};               //404 page
notfound.exec = function(){
    alert('URL does not exist. please check your code.');
}

var settings = {};               //global parameters
settings.partialCache = {};      //cache for partial pages
settings.divDemo = document.getElementById("demo");      //div for loading partials

ajaxRequest('404.html', 'GET','',function(status, partial){
    settings.partialCache.notfound = partial;
});        //cache 404 page first

function render(url){
    settings.rootScope = window[url];
    refresh(settings.divDemo, settings.rootScope);
}

function changeUrl() {          //handle url change
    var url = location.hash.replace('#','');
    if(url === ''){
        url = 'home';           //default page
    }
    ajaxRequest(url + '.html', 'GET', '',function(status, page){
        if(status == 404){
            url = 'notfound';       //404 page
            ajaxRequest('404.html','GET','',function(status, page404){
                settings.divDemo.innerHTML = page404;
                execFunc(url);              //load 404 controller
            });
        }
        else{
             settings.divDemo.innerHTML = page;
             execFunc(url);              //load url controller
        }
    });
}

function ajaxRequest(url, method, data, callback) {    //load partial page
    if(settings.partialCache[url]){
        callback(200, settings.partialCache[url]);
    }
    else {
        var xmlhttp = new XMLHttpRequest();
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
}

function refresh(node, scope) {
    var children = node.childNodes;
    if(node.nodeType != 3){                            //traverse child nodes, Node.TEXT_NODE == 3
        for(var k=0; k<node.attributes.length; k++){
            node.setAttribute(node.attributes[k].name,feedData(node.attributes[k].value, scope));       //replace variables defined in attributes
        }
        if(node.hasAttribute('data-src')){
            node.setAttribute('src',node.getAttribute('data-src'));             //replace src attribute
        }
        if(node.hasAttribute('data-action')){
            node.onclick = settings.rootScope[node.getAttribute('data-action')];             //replace src attribute
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
                    refresh(repeatNode,repeatScope);                           //iterate over all the cloned nodes
                }
                node.removeChild(children[j]);                                 //remove the empty template node
            }
            else{
                refresh(children[j],scope);                                    //not for repeating, just iterate the child node
            }
        }
    }
    else{
        node.textContent = feedData(node.textContent, scope);           //replace variables defined in the template
    }
}

function feedData(template, scope){                                     //replace variables with data in current scope
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

function execFunc(partial) {                            //execute the controller function responsible for current template
    var fn = window[partial].exec;
    if(typeof fn === 'function') {
        fn();
    }
}

changeUrl();    //initialize