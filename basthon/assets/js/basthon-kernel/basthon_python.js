(function (root, factory) {
    // requirejs?
    if (typeof define === 'function') {
        define(['./basthon_base'], factory);
    // TypeScript?
    } else if (typeof exports === 'object') {
        module.exports = factory();
    // default goes to global namespace
    } else {
        root.Basthon = factory(BasthonBase);
    }
}(this, function (BasthonBase) {
    'use strict';

    /**
     *
     */
    class BasthonPython extends BasthonBase {

        constructor () {
            super();
            
            /**
             * Version number (entry point for setup.py and publication to PyPi).
             * 
             * /!\ Warning: edit this line with care since it is parsed by
             * setup.py to get version number.
             */
            this.__version__ = "0.20.0";
            
            /**
             * Where to find pyodide.js (private).
             */
            this._pyodideUrl = "https://cdn.jsdelivr.net/pyodide/v0.16.1/full/pyodide.js";

            /**
             * Get the URL of Basthon modules dir.
             */
            this.basthonModulesRoot = this.basthonRoot() + "/modules";
        }
        
        version () { return this.__version__; };

        /**
         * What to do when loaded (private).
         */
        async _onload () {
            // get the version of Python from Python
            this.pythonVersion = pyodide.runPython("import platform ; platform.python_version()");
            // this is for avoiding "Unknown package 'basthon'" error
            // but can be removed  with 0.17.0 since it is fixed upstream
            const consoleErrorBck = console.error;
            console.error = () => {};
            await pyodide.loadPackage(this.basthonRoot() + "/basthon-py/basthon.js");
            console.error = consoleErrorBck;
            // importing basthon to get it's kernel
            await pyodide.runPythonAsync("import basthon as __basthon__");
            // kernel lookup
            this.__kernel__ = pyodide.globals.__basthon__.__kernel__;
            // removing basthon from global namespace
            await pyodide.runPythonAsync("del __basthon__");
        };

        /**
         * Start the Basthon kernel asynchronously.
         */
        async launch () {
            /* testing if Pyodide is installed locally */
            try {
                const url = this.basthonRoot() + "/pyodide/pyodide.js";
                await this.xhr({method: "HEAD", url: url});
                this._pyodideUrl = url;
            } catch (e) {}
            
            // forcing Pyodide to look at the right location for other files
            window.languagePluginUrl = this._pyodideUrl.substr(0, this._pyodideUrl.lastIndexOf('/')) + '/';
            
            // avoid conflict with requirejs and use it when available.
            try {
                if( typeof requirejs !== 'undefined' ) {
                    requirejs.config({paths: {pyodide: this._pyodideUrl.slice(0, -3)}});
                    await new Promise(function (resolve, reject) {
                        require(['pyodide'], resolve, reject);
                    });
                } else {
                    await this.loadScript(this._pyodideUrl);
                }
            } catch (error) {
                console.log(error);
                console.error("Can't load pyodide.js");
            }
            
            await languagePluginLoader.then(
                this._onload.bind(this),
                function() { console.error("Can't load Python from Pyodide"); });
            
            // waiting until page is loaded
            await this.pageLoad;
        };
        
        /**
         * Basthon async code evaluation function.
         */
        async evalAsync (code, outCallback, errCallback, data=null) {
            if( !this.loaded ) { return ; }
            if( typeof outCallback === 'undefined' ) {
                outCallback = function (text) { console.log(text); };
            }
            if( typeof errCallback === 'undefined' ) {
                errCallback = function (text) { console.error(text); };
            }
            // loading dependencies are loaded by eval
            return await this.__kernel__.eval(code, outCallback, errCallback, data);
        };

        /**
         * Restart the kernel.
         */
        restart () {
            if( !this.loaded ) { return ; }
            return this.__kernel__.restart();
        };

        /**
         * Put a file on the local (emulated) filesystem.
         */
        putFile (filename, content) {
            this.__kernel__.put_file(filename, content);
        };

        /**
         * Put an importable module on the local (emulated) filesystem
         * and load dependencies.
         */
        putModule (filename, content) {
            return this.__kernel__.put_module(filename, content);
        };
        
        /**
         * List modules launched via putModule.
         */
        userModules () {
            return this.__kernel__.user_modules();
        };
        
        /**
         * Put a ressource (file or *.py module) on the local (emulated)
         * filesystem. Detection is based on extension.
         */
        putRessource (filename, content) {
            const ext = filename.split('.').pop();
            if( ext === 'py' ) {
                return this.putModule(filename, content);
            } else {
                return this.putFile(filename, content);
            }
        };

        /**
         * Download a file from the VFS.
         */
        getFile (path) {
            return this.__kernel__.get_file(path);
        };
        
        /**
         * Download a user module file.
         */
        getUserModuleFile (filename) {
            return this.__kernel__.get_user_module_file(filename);
        };
        
        /**
         * Is the source ready to be evaluated or want we more?
         * Usefull to set ps1/ps2 for teminal prompt.
         */
        more (source) {
            return this.__kernel__.more(source);
        };
        
        /**
         * Mimic the CPython's REPL banner.
         */
        banner () {
            return this.__kernel__.banner();
        };
        
        /**
         * Complete a code at the end (usefull for tab completion).
         *
         * Returns an array of two elements: the list of completions
         * and the start index.
         */
        complete (code) {
            return this.__kernel__.complete(code);
        };
    }
    return new BasthonPython();
}));
