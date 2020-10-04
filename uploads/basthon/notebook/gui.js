"use strict";

/**
 * Callback for Basthon loading.
 */
function onLoad() {
    /* loading content from query string or from local storage */
    const notebook = Jupyter.notebook;
    // avoiding notebook loading failure.
    if( !notebook ) {
        location.reload();
    }
    if( !notebook.loadFromQS() ) {
        notebook.loadFromStorage();
    }

    /* saving to storage on multiple events */
    function saveCallback() { notebook.saveToStorage(); }
    for( let event of ['execute.CodeCell',
                       'finished_execute.CodeCell',
                       'output_added.OutputArea',
                       'output_updated.OutputArea',
                       'output_appended.OutputArea'] ) {
        notebook.events.bind(event, saveCallback);
    }
}

Basthon.Goodies.showLoader("Chargement de Basthon-Notebook...").then(onLoad);
