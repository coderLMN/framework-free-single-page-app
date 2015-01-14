//The following is customizable, and consistent to the templates used
var total = {};
total.exec = function(){
    total.emojis = settings.apiMap;
}
total.submit = function(){
    var mdText = document.getElementById('mdText');
    var render = document.getElementById('render');
    var data = {};
    data.mode = 'markdown';
    data.text = mdText.value;
    render.innerHTML = loadPartial('https://api.github.com/markdown', 'POST', JSON.parse(data));
}

var keys = {};
keys.exec = function(){
    keys.emojis = settings.apiMap;
}

var full = {};
full.exec = function(){
    full.emojis = settings.apiMap;
}

//The following code structure is mandatory
var home = {};            //default partial page, which will be loaded initially
home.exec = function(){   //bootstrap method

}

var notfound = {};        //404 page
notfound.exec = function(){
    alert('URL does not exist. please check your code.');
}

var settings = {};        //global parameters
settings.partialCache = {};      //cache for partial pages
settings.divDemo = document.getElementById("demo");      //div for loading partials
settings.divDemo.style.visible = false;
settings.apiMap = JSON.parse(loadPartial('https://api.github.com/emojis','GET',''));
loadPartial('404.html', 'GET','');        //cache 404 page first

function changeUrl() {          //handle url change
    var url = location.hash.replace('#','');
    if(url === ''){
        url = 'home';           //default page
    }
    var partial = loadPartial(url + '.html', 'GET', '');
    if(!partial){
        url = 'notfound';       //404 page
        partial = loadPartial('404.html','GET','');
    }
    settings.divDemo.innerHTML = partial;
    execFunc(url);              //load controller
    settings.rootScope = window[url];
    refresh(settings.divDemo, settings.rootScope);
    settings.divDemo.style.visible = true;
}

function loadPartial(href, method, data) {    //load partial page
    if(! settings.partialCache[href]){
        var xmlhttp = new XMLHttpRequest();
        xmlhttp.open(method, href, false);
        if(method === 'POST'){
            xmlhttp.setRequestHeader("Content-type","application/x-www-form-urlencoded");
        }
        xmlhttp.send(data);
        switch(xmlhttp.status) {
            case 404:                             //if the url is invalid, show the 404 page
                href = 'notfound';
                break;
            default:
                settings.partialCache[href] = xmlhttp.responseText;        //cache partials to improve performance
        }
        console.log(xmlhttp);
    }
    return settings.partialCache[href];
}

function refresh(node, scope) {
    var children = node.childNodes;

    if(node.nodeType != Node.TEXT_NODE){                            //traverse child nodes
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
            if(children[j].nodeType != Node.TEXT_NODE && children[j].hasAttribute('data-repeat')){     //handle repeat items
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