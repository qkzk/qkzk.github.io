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
            this.context = {Basthon: undefined,
                            Jupyter: undefined,
                            window: undefined,};
        }

        eval (code) {
            try {
                return window.eval(`with(Basthon.context) { ${code} }`);
            } catch (e) {
                if (e instanceof SyntaxError)
                    return (new Function(`with(this) { ${code} }`)).call(this.context);
                throw e;
            }
        };
        
        version () { return "0.0.0" };

        async launch () { await this.pageLoad; };
        
        async evalAsync (code, outCallback, errCallback, data=null) {
            // force interactivity in all modes
            data.interactive = true;

            // backup
            const console_log = console.log;
            const console_error = console.error;
            console.log = outCallback;
            console.error = errCallback;

            // evaluation
            let result = this.eval(code);

            // restoration
            console.log = console_log;
            console.error = console_error;

            // return result
            if( typeof result !== 'undefined' )
                result = {'text/plain': JSON.stringify(result)};
            return [result, ++this.execution_count];
        };

        restart () { };

        more (source) { return false; };

        banner () { return "Javascript REPL" };
          
        complete (code) { return []; };
    }

    return new Basthon();
}));
