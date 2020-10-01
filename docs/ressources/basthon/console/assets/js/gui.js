"use strict";

const localStorage = window.localStorage;
var editor = window.editor;
var shell = window.shell;

/**
 * Run the editor script in the shell.
 */
function runScript() {
    var src = editor.getValue();
    // backup the script just before running
    if (typeof(localStorage) !== "undefined") {
        localStorage.py_src = src;
    }
    shell.append(src.split('\n').join("\n... ") + "\n");
    shell.launch(src, false);
    shell.focus();
    shell.cursorToEnd();
}

/**
 * Dynamic graph resize. This is used to keep Matplotlib SVG
 * adjusted to graphics view.
 */
var dynamicMPLResize = function (event) {
    const graphDiv = document.getElementById("graphics");
    const canvas = graphDiv.firstChild;
    if( canvas ) {
        const ratio = canvas.width / canvas.height;
        const newWidth = Math.min(graphDiv.clientWidth,
                                  ratio * graphDiv.clientHeight);
        const newHeight = Math.min(graphDiv.clientHeight,
                                   graphDiv.clientWidth / ratio);
        canvas.style.width = newWidth + "px";
        canvas.style.height = newHeight + "px";
    }
};

Basthon.Goodies.showLoader("Chargement de Basthon...").then(
    function () {
        editor.init();
        shell.init();
        Basthon.addEventListener("eval.finished", function (data) {
            if( data.interactive && "result" in data ) {
                shell.append(data.result["text/plain"] + '\n');
            }
            shell.newline();
        });
        Basthon.addEventListener("eval.output", function (data) {
            shell.append(data.content);
        });
        Basthon.addEventListener("eval.error", function (data) {
            shell.newline();
        });
        Basthon.addEventListener("eval.display", function (data) {
            const graphDiv = document.getElementById("graphics");
            graphDiv.textContent = "";
            switch(data.display_type) {
            case "matplotlib":
                const root = data.content;
                const canvas = root.getElementsByTagName("canvas")[0];
                graphDiv.appendChild(canvas);

                dynamicMPLResize();
                window.addEventListener("resize", dynamicMPLResize);
                break;
            case "turtle":
                // Turtle result
                window.setTimeout(function () {
                    graphDiv.innerHTML = data.content.outerHTML;
                }, 1);
                break;
            case "sympy":
                graphDiv.innerHTML = data.content;
                if( typeof(MathJax) === "undefined" ) {
                    // dynamically loading MathJax
                    console.log("Loading MathJax (Sympy expression needs it).");
                    (function () {
                        var script = document.createElement("script");
                        script.type = "text/javascript";
                        script.src  = "https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.7/MathJax.js?config=TeX-MML-AM_CHTML";
                        document.getElementsByTagName("head")[0].appendChild(script);
                    })();
                } else {
                    // otherwise, render it
                    MathJax.Hub.Queue(['Typeset', MathJax.Hub, graphDiv]);
                }
                break;
            case "html":
                graphDiv.innerHTML = data.content;
                break;
            default:
                console.error("Not supported node type in eval.display result processing.");
            }
        });
    });

document.getElementById('run').addEventListener(
    'click', runScript);
document.getElementById('raz').addEventListener(
    'click',
    function () {
        Basthon.restart();
        shell.init();
        // cleaning canvas
        const graphDiv = document.getElementById("graphics");
        // textContent seems faster than innerHTML...
        graphDiv.textContent = "";
    });

/**
 * General hide/show popup function.
 */
function hideShowPopup(id, show) {
    const display = show ? 'block' : 'none';
    var elements = ["content", "close", "overlay"].map(
        _ => document.getElementById(id + "_" + _));
    elements.forEach(function (elem) {
        elem.style.display = display;
    });
}

/**
 * Managing script downloading.
 */
var button = document.getElementById("download");
button.addEventListener("click", function () { // download Python script
    var editor = ace.edit("editor");
    var code = editor.getValue();
    code = code.replace(/\r\n|\r|\n/g, "\r\n"); // To retain the Line breaks.
    var blob = new Blob([code], { type: "text/plain" });
    var anchor = document.createElement("a");
    anchor.download = "script.py";
    anchor.href = window.URL.createObjectURL(blob);
    anchor.target ="_blank";
    anchor.style.display = "none"; // just to be safe!
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
});


/**
 * Toggle hide/show shell/graph_view.
 */
var button = document.getElementById("btn_shell");
button.addEventListener("click", function () { // show shell
    document.getElementById("shell").style.display = "block";
    document.getElementById("graphics").style.display = "none";
    shell.cursorToEnd();
});

button = document.getElementById("btn_graph_view");
button.addEventListener("click", function () { // show graph view
    document.getElementById("shell").style.display = "none";
    document.getElementById("graphics").style.display = "flex";
    // this fix hidden graph when added during shell visible
    dynamicMPLResize();
});

/**
 * Recorded dark/light mode.
 */
var dark = true;

if (typeof(Storage) !== "undefined") {
    var tmp = localStorage.getItem("darkmode");
    dark = (tmp == null || tmp === "true");
}

function setDarkLight() {
    var shell = document.getElementById("shell");
    var editor = ace.edit("editor");
    if(dark) {
        shell.style['background-color'] = "#272822";
        shell.style['color'] = "#fff";
        editor.setTheme("ace/theme/monokai");
    } else {
        shell.style['background-color'] = "#fff";
        shell.style['color'] = "#272822";
        editor.setTheme("ace/theme/xcode");
    }
}

var button = document.getElementById("darklight");
button.addEventListener("click", function () { // switch dark/light mode in editor
    dark = !dark;
    if (typeof(Storage) !== "undefined") {
        localStorage.setItem("darkmode", dark);
    }
    setDarkLight();
});

setDarkLight();

/**
 * Script sharing via URL.
 */
function encode_string(component) {
    // encoding parentheses
    return encodeURIComponent(component).replace(/\(/g, '%28').replace(/\)/g, '%29');
}

function copy_to_clipboard(text) {
    var textArea = document.createElement("textarea");

    // Precautions from https://stackoverflow.com/questions/400212/how-do-i-copy-to-the-clipboard-in-javascript

    // Place in top-left corner of screen regardless of scroll position.
    textArea.style.position = 'fixed';
    textArea.style.top = 0;
    textArea.style.left = 0;

    // Ensure it has a small width and height. Setting to 1px / 1em
    // doesn't work as this gives a negative w/h on some browsers.
    textArea.style.width = '2em';
    textArea.style.height = '2em';

    // We don't need padding, reducing the size if it does flash render.
    textArea.style.padding = 0;

    // Clean up any borders.
    textArea.style.border = 'none';
    textArea.style.outline = 'none';
    textArea.style.boxShadow = 'none';

    // Avoid flash of white box if rendered for any reason.
    textArea.style.background = 'transparent';


    textArea.value = text;
    
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
        var successful = document.execCommand('copy');
        var msg = successful ? 'successful' : 'unsuccessful';
        console.log('Copying text command was ' + msg);
    } catch (err) {
        console.log('Oops, unable to copy');
    }
    
    document.body.removeChild(textArea);
}

var button = document.getElementById("share");
button.addEventListener("click", function () {
    hideShowPopup('share', true);
    var editor = ace.edit("editor");
    var code = editor.getValue();
    code = code.replace(/\r\n|\r|\n/g, "\r\n"); // To retain the Line breaks.
    var share_link = document.getElementById("sharing_link");
    var url = window.location.origin + '/?script=' + encode_string(code);
    share_link.href = url;
    copy_to_clipboard(url);
});


/**
 * Switching side view (recorded).
 */
var switched = false;

if (typeof(Storage) !== "undefined") {
    var tmp = localStorage.getItem("switched");
    switched = (tmp === "true");
}

function do_switch() {
    var div_left = document.getElementById("left-div");
    var div_right = document.getElementById("right-div");

    if(switched) {
        div_left.style.cssFloat = "right";
        div_right.style.cssFloat = "left";
    } else {
        div_left.style.cssFloat = "left";
        div_right.style.cssFloat = "right";
    }
}

var button = document.getElementById("switch");
button.addEventListener("click", function () {
    switched = !switched;
    
    if (typeof(Storage) !== "undefined") {
        localStorage.setItem("switched", switched);
    }

    do_switch();
});

do_switch();
