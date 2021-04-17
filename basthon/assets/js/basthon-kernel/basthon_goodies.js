(function (root, factory) {
    // requirejs?
    if (typeof define === 'function') {
        define(['./basthon_python'], factory);
    // TypeScript?
    } else if (typeof exports === 'object') {
        module.exports = factory();
    // default goes to global namespace
    } else {
        root.Basthon.Goodies = factory(root.Basthon);
    }
}(this, function (Basthon) {
    'use strict';

    let that = {};

    /**
     * Id to recover loader.
     */
    that.loaderId = "basthon-loader";
    
    /**
     * Show a fullscreen loader that diseapear when Basthon is loaded.
     * If you want to manually hide the loader, set hideAfter to false.
     */
    that.showLoader = async function (text, hideAfter=true) {
        // dynamically adding the loader to the DOM
        const root = document.createElement("div");
        root.id = that.loaderId;
        root.style.cssText = `
            position: fixed;
            display: block;
            top: 0px;
            left: 0px;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.65);
            text-align: center;
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 2000;`;
        const container = document.createElement("div");
        container.style.cssText = `
            display: flex;
            justify-content: center;
            align-items: center;
            flex-wrap: wrap;
            width: 100%;`;
        root.appendChild(container);
        const loader = document.createElement("div");
        loader.style.cssText = `
            position: relative;
            border: 16px solid #fcc24a;
            border-top: 16px solid #3b749c;
            border-bottom: 16px solid #3b749c;
            border-radius: 50%;
            width: 120px;
            height: 120px;
            animation: spin 2s linear infinite;
            overflow: auto;
            opacity: 0.8;`;
        container.appendChild(loader);
        let lineBreak = document.createElement("div");
        lineBreak.style.cssText = `
            flex-basis: 100%;
            height: 20px;`;
        container.appendChild(lineBreak);
        let textElem = document.createElement("div");
        textElem.innerHTML = text;
        textElem.style.cssText = "color: white;";
        container.appendChild(textElem);
        that._loaderTextElem = textElem;

        // global style for spining
        const style = document.createElement("style");
        document.head.appendChild(style);
        style.sheet.insertRule(`
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }`);
        
        document.body.appendChild(root);

        // backup root
        that._rootLoader = root;
        
        // waiting for Basthon
        await Basthon.load;

        // hide the loader if requested
        if( hideAfter ) {
            that.hideLoader();
        }
    };

    /**
     * Setting the text loader.
     */
    that.setLoaderText = function (text) {
        that._loaderTextElem.innerHTML = text;
    };

    /**
     * Hide the Basthon's loader.
     */
    that.hideLoader = function () {
        const root = that._rootLoader;
        const toHide = Array.prototype.slice.call(root.children);
        toHide.push(root);
        toHide.forEach(function (elem) {
            elem.style.display = "none";
        });
    };
    
    return that;
}));
