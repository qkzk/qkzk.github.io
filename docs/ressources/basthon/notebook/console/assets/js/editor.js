"use strict";

window.editor = (function () {
    var that = window.ace.edit("editor");
    
    /**
     * Initialize the editor's content.
     */
    that.loadScript = function () {
        /* get QS from curent URL */
        function queryString() {
            var search = window.location.search;
            if( search[0] === '?' ) { search = search.substr(1); }
            var query = {};
            for( let param of search.split('&') ) {
                const pair = param.split("=");
                query[pair[0]] = decodeURIComponent(pair[1]);
            }
            return query;
        }
        
        /* set script from:
           -> query string if submited
           -> local storage if available
           -> default otherwise
        */
        var params = queryString();
        if( 'script' in params ) {
            editor.setValue(params.script);
        } else if( (typeof(localStorage) !== "undefined") && "py_src" in localStorage) {
            editor.setValue(localStorage.py_src);
        } else {
            editor.setValue('for i in range(10):\n\tprint(i)');
        }
        
        editor.scrollToRow(0);
        editor.gotoLine(0);
    };

    /**
     * Initialize the Ace editor.
     */
    that.init = function () {
        editor.session.setMode("ace/mode/python");
        editor.focus();
        
        editor.setOptions({
            'enableLiveAutocompletion': true,
            'highlightActiveLine': false,
            'highlightSelectedWord': true,
            'fontSize': '12pt',
        });
        
        that.loadScript();
    };

    return that;
})();
