"use strict";

window.shell = (function () {
    var that = document.getElementById("shell");
    
    /**
     * Common Python prompt.
     */
    that.promptPrefix = ">>> ";
    
    /**
     * Common Python newline in block.
     */
    that.blockPrefix = "... ";
    
    /**
     * Initialize the shell.
     */
    that.init = function () {
        that.value = "Python " + Basthon.pythonVersion + "\n";
        that.value += 'Type "help", "copyright", "credits" or "license" for more information.\n';
        that.value += that.promptPrefix;
        that.history = [];
        that.historyPosition = 0;
        that.focus();
        that.cursorToEnd();
    };

    /**
     * Updating history with piece of code.
     */
    that.pushToHistory = function (src) {
        src.split('\n').forEach(function (line) {
            if( line.length > 0 ) {
                const lastHistoryLine = that.history[that.history.length - 1];
                if( line !== lastHistoryLine) { that.history.push(line); }
            }
        });
        that.historyPosition = that.history.length;
    };

    /**
     * Current line hidden by history look-up.
     */
    that.lineHiddenByHistory = "";

    /**
     * Get string just after last prompt.
     */
    that.lastLine = function () {
        const src = that.value;
        return src.slice(src.lastIndexOf('\n') + that.promptPrefix.length + 1);
    };

    /**
     * Display current history on last line.
     */
    that.displayCurrentHistory = function () {
        var toAdd;
        if( that.historyPosition >= that.history.length ) {
            toAdd = that.lineHiddenByHistory;
        } else {
            toAdd = that.history[that.historyPosition];
        }
        const src = that.value;
        that.value = src.slice(0, src.lastIndexOf('\n') + that.promptPrefix.length + 1) + toAdd;
    };

    /**
     * Go backward in history.
     */
    that.backwardHistory = function () {
        if( that.historyPosition === that.history.length ) {
            that.lineHiddenByHistory = that.lastLine();
        }
        that.historyPosition = Math.max(0, that.historyPosition - 1);
        that.displayCurrentHistory();
    };

    /**
     * Go forward in history.
     */
    that.forwardHistory = function () {
        if( that.historyPosition < that.history.length ) {
            that.historyPosition++;
        }
        that.displayCurrentHistory();
    };

    /**
     * New line with prompt.
     */
    that.newline = function() {
        that.value += that.promptPrefix;
        that.cursorToEnd();
    };

    /**
     * Append piece of text to the shell.
     */
    that.append = function (text) {
        that.value += text;
    };
    
    /**
     * Put the shell cursor to the end.
     */
    that.cursorToEnd = function () {
        // cursor to end
        that.cursorGoTo(that.value.length);
        that.scrollTop = that.scrollHeight;
    };

    /**
     * Cursor position.
     */
    that.cursorPos = function () {
        return that.selectionStart;
    };

    /**
     * Set cursor to position.
     */
    that.cursorGoTo = function (pos) {
        that.setSelectionRange(pos, pos);
    };
    
    /**
     * Is cursor on last line?
     */
    that.cursorOnLastLine = function () {
        return that.value.lastIndexOf('\n') < that.cursorPos();
    };

    /**
     * Is cursor after last prompt?
     */
    that.cursorAfterLastPrompt = function () {
        return that.cursorOnLastLine() && that.cursorColumn() >= that.promptPrefix.length;
    };

    /**
     * Is cursor just after last prompt?
     */
    that.cursorJustAfterLastPrompt = function () {
        return that.cursorOnLastLine() && that.cursorColumn() === that.promptPrefix.length;
    };

    /**
     * Is cursor right after last prompt?
     */
    that.cursorRightAfterLastPrompt = function () {
        return that.cursorOnLastLine() && that.cursorColumn() > that.promptPrefix.length;
    };

    /**
     * Get the curent column of the cursor.
     */
    that.cursorColumn = function () {
        const pos = that.cursorPos();
        const before = that.value.slice(0, pos);
        return pos - before.split('\n').slice(0, -1).join('\n').length - 1;
    };

    /**
     * Launch code in shell.
     */
    that.launch = function (code, interactive=true) {
        // updating history
        that.pushToHistory(code);
        // ready for computing
        Basthon.dispatchEvent("eval.request", {code: code,
                                               interactive: interactive});
    };
    
    /**
     * Callback for keypress event.
     */
    that.keypress = function (event) {
        if( !that.cursorAfterLastPrompt() ) {
            event.preventDefault();
            return;
        }
        switch(event.keyCode) {
        case 13: // return
            if( event.shiftKey ) {
                that.append('\n' + that.blockPrefix);
            } else {
                var src = that.value;
                // last line starting by prompt
                const start = src.lastIndexOf(that.promptPrefix);
                src = src.substr(start + that.promptPrefix.length);
                // removing newlines + ...
                src = src.split('\n... ').join('\n');
                that.append('\n');
                that.launch(src, true);
            }
        
            that.cursorToEnd();
            event.preventDefault();
            break;
        }
    };

    /**
     * Callback for keydown event.
     */
    that.keydown = function (event) {
        switch(event.keyCode) {
        case 9: // tab
            that.append("    ");
            event.preventDefault();
            break;
        case 37: // left arrow
            if( that.cursorJustAfterLastPrompt() ) {
                event.preventDefault();
                event.stopPropagation();
            }
            break;
        case 36: // line start
            if( that.cursorAfterLastPrompt() ) {
                that.cursorGoTo(that.cursorPos() - that.cursorColumn() + that.promptPrefix.length);
                event.preventDefault();
                event.stopPropagation();
            }
            break;
        case 38: // up
            if( that.cursorAfterLastPrompt() ) {
                that.backwardHistory();
                event.preventDefault();
            }
            break;
        case 40: // down
            if( that.cursorAfterLastPrompt() ) {
                that.forwardHistory();
                event.preventDefault();
            }
            break;
        case 8: // backspace
            if( !(that.cursorRightAfterLastPrompt()
                  || (that.cursorJustAfterLastPrompt()
                      && that.selectionStart < that.selectionEnd)) ) {
                event.preventDefault();
                event.stopPropagation();
            }
            break;
        case 65: // a (for ctrl+a)
            if( !event.ctrlKey ) { break; }
            var src = that.value;
            var start = that.cursorPos() - that.cursorColumn() + that.promptPrefix.length;
            that.setSelectionRange(start, src.length);
            event.preventDefault();
            break;
        case 33: // page up
            event.preventDefault();
            break;
        case 34: // page down
            event.preventDefault();
            break;
        }
    };

    /* pluging callbacks to events */
    that.addEventListener("keypress", that.keypress);
    that.addEventListener("keydown", that.keydown);

    return that;
})();
