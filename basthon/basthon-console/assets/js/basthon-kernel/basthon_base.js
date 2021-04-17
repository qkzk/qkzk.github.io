(function (root, factory) {
    // requirejs?
    if (typeof define === 'function') {
        define(['module'], factory);
    // TypeScript?
    } else if (typeof exports === 'object') {
        module.exports = factory();
    // default goes to global namespace
    } else {
        root.BasthonBase = factory();
    }
}(this, function (module) {
    'use strict';

    /**
     * An error thrown by not implemented API functions.
     */
    function NotImplementedError(func) {
        this.message = `Function ${func} not implemented!`;
    };

    /**
     * API that any Basthon kernel should fill to be supported
     * in console/noetbook.
     */
    return class {
        constructor() {

            /** Is the kernel loaded? */
            this.loaded = false;

            /** The current script URL. */
            this. urlScript = (function () {
                if( module != null ) {
                    let url = window.location.origin + window.location.pathname;
                    url = url.substring(0, url.lastIndexOf('/')) + "/";
                    return url + module.uri;
                } else
                    return document.currentScript.src;
            })();

            /** Promise that resolve when the page is loaded. */
            this.pageLoad = this._pageLoad();
            /** Promie that resolve when the kernel is loaded. */

            this.load = this.launch().then( () => {
                this.loaded = true;
                // connecting eval to basthon.eval.request event.
                this.addEventListener("eval.request",
                                      this.evalFromEvent.bind(this));
            });
        }

        /**
         * Kernel version number (string).
         */
        version () { throw new NotImplementedError("version"); };

        /**
         *
         */
        async launch () { throw new NotImplementedError("launch"); };
        
        /**
         * Async code evaluation that resolves with the result.
         */
        evalAsync (code, outCallback, errCallback, data=null) {
            throw new NotImplementedError("evalAsync");
        };

        restart () { throw new NotImplementedError("restart"); };

        putFile (filename, content) {
            throw new NotImplementedError("putFile");
        };

        putModule (filename, content) {
            throw new NotImplementedError("putModule");
        };

        putRessource (filename, content) {
            throw new NotImplementedError("putRessource");
        };

        userModules () { throw new NotImplementedError("userModules"); };

        getFile (path) { throw new NotImplementedError("getFile"); };

        getUserModuleFile (filename) {
            throw new NotImplementedError("getUserModuleFile");
        };

        more (source) { throw new NotImplementedError("more"); };

        banner () { throw new NotImplementedError("banner"); };
          
        complete (code) { return []; };

        /**
         * An URL without it's basename.
         */
        dirname (url) {
            return url.substring(0, url.lastIndexOf("/"));
        };

        /**
         * Root for kernel files. This is always the versnion number
         * directory inside the current script directory.
         */
        basthonRoot () {
            return this.dirname(this.urlScript) + "/" + this.version();
        };

        /**
         * Downloading data (bytes array) as filename
         * (opening browser dialog).
         */
        download (data, filename) {
            let blob = new Blob([data], { type: "application/octet-stream" });
            let anchor = document.createElement("a");
            anchor.download = filename;
            anchor.href = window.URL.createObjectURL(blob);
            anchor.target ="_blank";
            anchor.style.display = "none"; // just to be safe!
            document.body.appendChild(anchor);
            anchor.click();
            document.body.removeChild(anchor);
        };

        /**
         * Dynamically load a script asynchronously.
         */
        loadScript (url) {
            return new Promise(function(resolve, reject) {
                let script = document.createElement('script');
                script.onload = resolve;
                script.onerror = reject;
                script.src = url;
                document.head.appendChild(script);
            });
        };

        /**
         * Returns a promise that resolves when page is loaded.
         */
        _pageLoad () {
            return new Promise(function (resolve, reject) {
                if( document.readyState === 'complete' ) {
                    resolve();
                } else {
                    window.addEventListener("load", function() {
                        // just to be safe
                    window.removeEventListener("load", this);
                        resolve();
                    });
                }
            });
        };

        /**
         * Wraper around XMLHttpRequest.
         */
        xhr (params) {
            const xhr = new XMLHttpRequest();
            xhr.open(params.method, params.url, true);
            if( params.responseType != null )
                xhr.responseType = params.responseType;
            const promise = new Promise(function(resolve, reject) {
                xhr.onload = function() {
                    if( xhr.status >= 200 && xhr.status < 300 ) {
                        resolve(xhr.response);
                    } else {
                        reject(xhr);
                    }
                };
                xhr.onerror = function () { reject(xhr); };
            });
            // headers
            if (params.headers) {
                Object.keys(params.headers).forEach(function (key) {
                    xhr.setRequestHeader(key, params.headers[key]);
                });
            }
            // data
            let data = params.data;
            if (data && typeof data === 'object') {
                data = JSON.stringify(data);
            }
            xhr.send(data);
            return promise;
        };

        /**
         * Wrapper around document.dispatchEvent.
         * It adds the 'basthon.' prefix to each event name and
         * manage the event lookup to retreive relevent data.
         */
        dispatchEvent (eventName, data) {
            const event = new CustomEvent("basthon." + eventName, { detail: data });
            document.dispatchEvent(event);
        };

        /**
         * Wrapper around document.addEventListener.
         * It manages the 'basthon.' prefix to each event name and
         * manage the event lookup to retreive relevent data.
         */
        addEventListener (eventName, callback) {
            document.addEventListener(
                "basthon." + eventName,
                function (event) { callback(event.detail); });
        };

        /**
         * Simple clone via JSON copy.
         */
        clone (obj) {
            // simple trick that is enough for our purpose.
            return JSON.parse(JSON.stringify(obj));
        };

        /**
         * Internal. Code evaluation after an eval.request event.
         */
        evalFromEvent (data) {
            if( !this.loaded ) { return ; }

            const that = this;
            
            let stdCallback = function (std) { return function (text) {
                let dataEvent = that.clone(data);
                dataEvent.stream = std;
                dataEvent.content = text;
                that.dispatchEvent("eval.output", dataEvent);
            }};
            let outCallback = stdCallback("stdout");
            let errCallback = stdCallback("stderr");
            
            return that.evalAsync(data.code, outCallback, errCallback, data)
                .then(function (args) {
                    const result = args[0];
                    const executionCount = args[1];
                    let dataEvent = that.clone(data);
                    dataEvent.execution_count = executionCount;
                    if( typeof result !== 'undefined' ) {
                        dataEvent.result = result;
                    }
                    that.dispatchEvent("eval.finished", dataEvent);
                }, function (error) {
                    errCallback(error.toString());
                    let dataEvent = that.clone(data);
                    dataEvent.error = error;
                    dataEvent.execution_count = that.execution_count;
                    that.dispatchEvent("eval.error", dataEvent);
                });
        };
    };
}));
