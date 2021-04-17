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

    class Basthon extends BasthonBase {
        constructor() {
            super();
            this.execution_count = 0;
        }
        
        version () { return "0.0.0" };

        async launch () {
            await this.loadScript("https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.5.0/sql-wasm.min.js");

            const SQL = await window.initSqlJs({
                locateFile: file => `https://sql.js.org/dist/${file}`
            });

            this.db = new SQL.Database();

            await this.pageLoad;
        };
        
        async evalAsync (code, outCallback, errCallback, data=null) {
            // force interactivity in all modes
            data.interactive = true;

            let result = this.db.exec(code);

            // return result
            if( typeof result !== 'undefined' )
                result = {'text/plain': JSON.stringify(result)};
            return [result, ++this.execution_count];
        };

        restart () { };

        more (source) { return false; };

        banner () { return "SQL REPL" };
          
        complete (code) { return []; };
    }

    return new Basthon();
}));
