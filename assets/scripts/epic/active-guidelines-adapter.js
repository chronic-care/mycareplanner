/*
 * load agl.js before this
 */

 if ( window.parent != window ) {
    var activeGuidelines ;

    activeGuidelines = new ActiveGuidelines( {
        requestOrigin: '*',
        allowedOrigin: ActiveGuidelines.ORIGIN_REQUEST,
        autoHandshake: false,
    } );
    activeGuidelines.actionSupported( function(action) {
        console.log( 'ActiveGuidelines action supported: "' + action + '"' ) ;
        if ( action == ActiveGuidelines.OPEN_WINDOW ) {
            var clickHandler = function (evt) {
                var target = evt.target || evt.srcElement ;
                var href = target.getAttribute( 'href' ) ;
                // var anchorTarget = target.getAttribute( 'target' ) ;
                if ( target.tagName === 'A' && href && /^https?:\/\//.test(href) ) {
                    console.log( 'ActiveGuidelines detected anchor click for "' + href + "'..." ) ;
                    console.log( 'ActiveGuidelines preventing click and triggering window open request...' ) ;
                    activeGuidelines.openWindow( href ) ;
                    evt.preventDefault() ;
                }
            }
            
            if ( document.addEventListener ) {
                console.log( 'ActiveGuidelines adding event listener...' ) ;
                document.addEventListener( 'click', clickHandler ) ;
            } else if ( document.attachEvent ) {
                console.log( 'ActiveGuidelines attaching event...' ) ;
                document.attachEvent( 'click', clickHandler ) ;
            }
        }
    } ) ;
    activeGuidelines.handshake(
        true,
        function (agl) { console.log( 'ActiveGuidelines handshake SUCCESS', agl ); },
        function (err) { console.log( 'ActiveGuidelines handshake FAILURE', err ); }
    );
 }

