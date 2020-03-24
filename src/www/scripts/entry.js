var MxApp = require("@flowfabric/mendix-hybrid-app-base");

MxApp.onConfigReady(function(config) {
    // Perform any custom operations on the dojoConfig object here
    //EH
    //we receive an extra parameter now: handleBackButtonForApp (from manipulated app.js - see https://github.com/FlowFabric/hybrid-app-base)
    //we can use it for our custom bacbutton handler.
    console.log('RE-INITIALIZE BACKBUTTON');
    var _oldHandleBackButtonForApp = handleBackButtonForApp;
    //create the new function in the config, it will be picked up in the app.js s
    config.customHandleBackButtonForApp = function(e) {
            //first check the global var ignoreBackbutton. It can be a boolean or a function returning a boolean. This can be used and set with javascript in your mobile offline app
            if (!window.ignoreBackbutton) {
                _oldHandleBackButtonForApp(e);
            } else if (window.ignoreBackbutton && typeof window.ignoreBackbutton === 'function' && !window.ignoreBackbutton()) {
                _oldHandleBackButtonForApp(e);
            }
            //ignoring back button means we do nothing.
        }
        //~EH

    // Ticket #79447: https://support.mendix.com/hc/en-us/requests/79447
    // Don't download files that are already on the device
    var _downloadFileFn = config.data.offlineBackend.downloadFileFn;
    var downloadDir;
    config.data.offlineBackend.getStorageDirFn(
        function(dir) {
            downloadDir = dir.nativeURL;
        },
        function(err) {}
    )
    config.data.offlineBackend.downloadFileFn = function(src, dst, callback, error) {
        var target = downloadDir + "files/" + dst;
        window.resolveLocalFileSystemURL(target, function() {
            callback();
        }, function() {
            return _downloadFileFn(src, dst, callback, error);
        });
    }

    //EH - when the app is inactive for a longer time and resumes again, an error occurs that the DB is closed. This happens because the default window.onbeforeunload event closes the database. Below script will reopen the db again on resume.
    var oldCreateStoreFn = config.store.createStoreFn;
    config.store.createStoreFn = function() {
        var currDB = oldCreateStoreFn.call(config.store);
        document.addEventListener("resume",
            function(e) {
                function openDB() {
                    //open database
                    console.log('onresume: Open DB');
                    config.store.createStoreFn();
                }
                //reopen database if it's closed to overcome bug of closed database error
                if (Object.entries(currDB.openDBs).length == 0) {
                    openDB();
                }
            }, false);
        return currDB;
    };

});

MxApp.onClientReady(function(mx) {
    // Perform any custom operations on the Mendix client object here
});

// Uncomment this function if you would like to control when app updates are performed
/*
MxApp.onAppUpdateAvailable(function(updateCallback) {
    // This function is called when a new version of your Mendix app is available.
    // Invoke the callback to trigger the app update mechanism.
});
*/