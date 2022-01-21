
/*
 * Options:
 * 
 * timeoutMs:         number of milliseconds to wait for an AGL response before throwing an error
 * onDebug:           function accepting one argument which is text to be added to a visible place on the page
 * onActionSupported: function accepting one argument which is the name of an action which
 *                    is supported in the current AGL session
 * requestOrigin:     origin of the http request which rendered this page
 * allowedOrigin:     what origins should be allowed for sending/receiving AGL messages;
 *                    ActiveGuidelines.ORIGIN_ANY     -> any origin is permitted (least secure)
 *                    ActiveGuidelines.ORIGIN_REQUEST -> only the requesting origin is permitted (more secure)
 * autoHandshake:     true/false (default: true); setting this to false disables
 *                    automatically triggering an AGL handshake when the page is loaded 
 *
 * Methods:
 * 
 * activeGuidelines.debug( callback )
 *     sets the onDebug callback; returns this instance of ActiveGuidelines
 *      
 * activeGuidelines.actionSupported( callback )
 *     sets the onActionSupported callback; returns this instance of ActiveGuidelines
 *     
 * activeGuidelines.actionSupported( action, callback )
 *     sets the onActionSupported callback for only the specified action; returns this instance of ActiveGuidelines
 *     for action, use ActiveGuidelines.POST_ORDER, etc.
 *      
 * activeGuidelines.handshake( discardExistingToken ):
 * 
 *     initiates the session, acquiring a session token; returns a request which is a Promise 
 *      
 * activeGuidelines.placeOrder( orderKey, aglOverrides ):
 *     places an order; returns a request which is a Promise 
 * 
 * 
 * Usage:
 * var activeGuidelines = new ActiveGuidelines( {
 *        requestOrigin: '${request.location}'
 *        allowedOrigin: ActiveGuidelines.ORIGIN_REQUEST,
 *        } )
 *       .debug( function(text) {
 *       	$('<div class="error">' + text + '</div>').appendTo( $('#debugger' ) ) ;
 *       } )
 *       .actionSupported( ActiveGuidelines.POSTORDER, function() {
 *       	$( 'button.order' ).prop( 'disabled', false ) ;
 *       } )
 *       ;
 * 
 * // initial handshake will be automatically performed
 * // to prevent automatic handshaking, either
 * //  a) use "autoHandshake: false" in the initial config OR
 * //  b) manually handshake like this:
 * activeGuidelines.handhake()
 *   .then( function(data) {
 *      $( '.ready-message' ).show() ; // successful handshake
 *   } )
 *   .catch( function(err) {
 *      $( '.error-message' ).show() ; // handshake failed
 *   } )
 *   ;
 * 
 * function placeOrder() {
 *       return activeGuidelines
 *       	.placeOrder( "MY_ORDER_KEY", { OrderMode: "IP" } )
 *       	.then( function(data) {
 *       		$("<span>ordering succeeded</span>").appendTo( $("div.order") ) ;
 *       	} ) ;
 *       	.catch( function(reason) {
 *       		$("<span>ordering failed</span>").appendTo( $("div.order") ) ;
 *       	} ) ;
 *       ;
 * }
 * 
 * $( 'button.order' ).click( placeOrder ) ;
 * 
 */

ActiveGuidelines = function() {
	var config = {
		timeoutMs: 5000,
		onDebug: undefined,
		onActionSupported: undefined,
		onSpecificActionSupported: { },
		requestOrigin: undefined,
		allowedOrigin: ActiveGuidelines.ORIGIN_REQUEST,
		selfOrigin: location.origin,
		autoHandshake: true,
	};
	
	for ( var i in arguments) {
		if (typeof arguments[i] == 'object') {
			for ( var opt in arguments[i]) {
				config[opt] = arguments[i][opt];
			}
		}
	}

	var formatOrigin = function( obj, property ) {
		var url = obj[property]; 
		if ( url ) {
			var match = /^([a-zA-Z]+:\/\/)?[^/]+/.exec( url ) ;
			if ( match )
				obj[property] = match[0] ;
		}
	}
	
	 formatOrigin( config, 'requestOrigin' ) ;
	 formatOrigin( config, 'allowedOrigin' ) ;
	
	this.config = function() { return config ; }

	var session = {
		token: null,
		request: null
	} ;
	this.session = function() { return session ; }
	
	var activeGuidelines = this ;
	window.setTimeout( function() { activeGuidelines.autoHandshake() ; }, 0 ) ;
};

ActiveGuidelines.HANDSHAKE = "Epic.Clinical.Informatics.Web.InitiateHandshake" ;
ActiveGuidelines.CLOSE_ACTIVITY = "Epic.Clinical.Informatics.Web.CloseActivity" ;
ActiveGuidelines.SAVE_STATE = "Epic.Clinical.Informatics.Web.SaveState" ;
ActiveGuidelines.POST_ORDER = "Epic.Clinical.Informatics.Web.PostOrder" ;
ActiveGuidelines.REMOVE_TRIGGER_ORDER = "Epic.Clinical.Informatics.Web.RemoveTriggerOrder" ;
ActiveGuidelines.REMOVE_SPECIFIC_ORDER = "Epic.Clinical.Informatics.Web.RemoveSpecifiedOrder" ;
ActiveGuidelines.POST_FLOWSHEET_ROW = "Epic.Clinical.Informatics.Web.PostFlowsheetRow" ;
ActiveGuidelines.OPEN_WINDOW = "Epic.Clinical.Informatics.Web.OpenExternalWindow" ;

ActiveGuidelines.ORIGIN_ANY = "*" ;
ActiveGuidelines.ORIGIN_REQUEST = "__USE_REQUEST_ORIGIN__" ;


// POST_ORDER properties
ActiveGuidelines.PO_ORDER_KEY                = "OrderKey" ; // [REQUIRED] identifier from associated Preference List
ActiveGuidelines.PO_ORDER_NAME               = "OrderName" ; // overrides the name of the order 
ActiveGuidelines.PO_ORDER_MODE               = "OrderMode" ; // enter "IP" for inpatient or "OP" for outpatient
ActiveGuidelines.PO_ORDER_MODE_INPATIENT  = "IP" ;
ActiveGuidelines.PO_ORDER_MODE_OUTPATIENT = "OP" ;
ActiveGuidelines.PO_DOSE                     = "Dose" ; // numeric string
ActiveGuidelines.PO_DOSEUNIT                 = "DoseUnit" ; // a dose unit from the category list in Epic (IECT 9101)
ActiveGuidelines.PO_FREQUENCY                = "Frequency" ; // a frequency that corresponds to a value that has been set in an interface (AIF) table using specification 9158-CDS Order Defaults
ActiveGuidelines.PO_PRIORITY                 = "Priority" ; // a priority from the category list in Epic (I ORD 120)
ActiveGuidelines.PO_ROUTE                    = "Route" ; // route from the category list in Epic (I ORD 7025)
ActiveGuidelines.PO_ADMIN_INSTRUCTIONS       = "AdminInstructions" ; // free text
ActiveGuidelines.PO_INDICATIONS_OF_USE       = "IndicationsOfUse" ; // a string OR an array
ActiveGuidelines.PO_INDICATIONSCOMMENT       = "IndicationsComment" ; // string
ActiveGuidelines.PO_DECISION_SUPPORT_SESSION = "DecisionSupportSession" ;
ActiveGuidelines.PO_DECISION_SUPPORT_SCORE   = "DecisionSupportScore" ;
ActiveGuidelines.PO_ORDER_SPECIFIC_QUESTIONS = "OrderSpecificQuestions" ; // array of OrderSpecificQuestion objects
ActiveGuidelines.PO_OVERRIDE_DETAILS         = "OverrideData" ; // object containing anything else, recorded for auditing purposes
ActiveGuidelines.PO_PROPERTIES = {
	required: [
       ActiveGuidelines.PO_ORDER_KEY
       ],
    optional: [
        ActiveGuidelines.PO_ORDER_NAME,
        ActiveGuidelines.PO_ORDER_MODE,
		ActiveGuidelines.PO_DOSE,
		ActiveGuidelines.PO_DOSEUNIT,
		ActiveGuidelines.PO_FREQUENCY,
		ActiveGuidelines.PO_PRIORITY,
		ActiveGuidelines.PO_ROUTE,
		ActiveGuidelines.PO_ADMIN_INSTRUCTIONS,
		ActiveGuidelines.PO_INDICATIONS_OF_USE,
		ActiveGuidelines.PO_INDICATIONSCOMMENT,
		ActiveGuidelines.PO_DECISION_SUPPORT_SESSION,
		ActiveGuidelines.PO_DECISION_SUPPORT_SCORE,
		ActiveGuidelines.PO_ORDER_SPECIFIC_QUESTIONS, 
		ActiveGuidelines.PO_OVERRIDE_DETAILS 
       ]
} ;
// POST_ORDER : Order Specific Question properties
ActiveGuidelines.PO_OSQ_KEY            = "Key" ; // [required] a key in your Epic system that represents a question  
ActiveGuidelines.PO_OSQ_PARENTQUESTION = "ParentQuestion" ; // key for the parent question  
ActiveGuidelines.PO_OSQ_ANSWERS        = "Answers" ; // an Answer object or array of Answer objects  
//POST_ORDER : Order Specific Question : Answer properties
ActiveGuidelines.PO_OSQ_ANS_ANSWER  = "Answer" ; // a string  
ActiveGuidelines.PO_OSQ_ANS_COMMENT = "Comment" ;

// POST_FLOWSHEET_ROW properties
ActiveGuidelines.PFR_FLOID    = "FLOID" ; // [Required, if no current flowsheet cell] the flowsheet row to which to file your value
ActiveGuidelines.PFR_ROWNAME  = "RowName" ; // [Required, if no current flowsheet cell] the name of the row, which the user sees in your webpage
ActiveGuidelines.PFR_ROWVALUE = "RowValue" ; // [Required] the flowsheet row to which to file your value
ActiveGuidelines.PFR_PEND     = "Pend" ; // if the value should be pended instead of filed
ActiveGuidelines.PFR_PROPERTIES = {
		required: [
	       ActiveGuidelines.PFR_FLOID,
	       ActiveGuidelines.PFR_ROWNAME,
	       ActiveGuidelines.PFR_ROWVALUE
	       ],
	    optional: [
			ActiveGuidelines.PFR_PEND
	       ]
	} ;


/* 
 ********** callbacks **********
 */ 

ActiveGuidelines.prototype.debug = function( callback ) { this.config().onDebug = callback; return this ; }

ActiveGuidelines.prototype.actionSupported = function( actionOrCallback ) {
	if ( typeof actionOrCallback == 'function' ) {
		
		this.config().onActionSupported = actionOrCallback;
		
	} else {
		
		this.config().onSpecificActionSupported[ actionOrCallback ] = arguments[1] ;
		
	}
	return this ;
}

ActiveGuidelines.prototype.allowedOrigin = function() {
	if ( this.config().allowedOrigin == ActiveGuidelines.ORIGIN_REQUEST )
		return this.config().requestOrigin || this.config().selfOrigin ;
	else
		return this.config().allowedOrigin || this.config().selfOrigin ;
}

/* 
 ********** automatic intialization **********
 */ 

ActiveGuidelines.prototype.autoHandshake = function() {

	// delay execution until readyState == 'complete'; check the autoHandshake flag again at that time 
	if ( document.readyState != 'complete' ) {
		
		var activeGuidelines = this ;
		document.addEventListener( 'readystatechange', function( evt ) {
			if ( document.readyState == 'complete' )
				activeGuidelines.autoHandshake() ;
		}) ;
		return ;
	}		
	
	if ( this.config().autoHandshake )
		this.handshake( false ) ;
}

/* 
 ********** standard AGL functions **********
 */ 

ActiveGuidelines.prototype.handshake = function( discardExistingToken, onResolved, onRejected ) {
	this.config().autoHandshake = false ; // handshaking disables auto-handshake (only relevant if it's still pending)
	
	if ( document.readyState != 'complete' ) {
		
		var activeGuidelines = this ;
		document.addEventListener( 'readystatechange', function( evt ) {
			if ( document.readyState == 'complete' ) 
				activeGuidelines.handshake( discardExistingToken, onResolved, onRejected ) ;
		}) ;

		return ;
	}		
	
	
	if ( discardExistingToken || !this.session().token )
		return this.request(ActiveGuidelines.HANDSHAKE,null, onResolved, onRejected) ;
	else if ( typeof onResolved == 'function' )
		return window.setTimeout( onResolved, 0 ) ;
	else
		return ;
}

ActiveGuidelines.prototype.postOrder = function( orderKey, aglOverrides, onResolved, onRejected ) {
	var orderDetails = { }
	
	orderDetails[ ActiveGuidelines.PO_ORDER_KEY ] = orderKey ;
	
	if (aglOverrides) for ( var n in aglOverrides ) {
		if ( ActiveGuidelines.PO_PROPERTIES.optional.indexOf( n ) < 0 ) {
			if ( !orderDetails[ActiveGuidelines.PO_OVERRIDE_DETAILS] )
				orderDetails[ActiveGuidelines.PO_OVERRIDE_DETAILS] = {} ;
			orderDetails[ActiveGuidelines.PO_OVERRIDE_DETAILS][n] = aglOverrides[n] ; 
		} else {
			orderDetails[n] = aglOverrides[n] ;
		}
	}
	
	return this.request(ActiveGuidelines.POST_ORDER,orderDetails, onResolved, onRejected) ;
}

ActiveGuidelines.prototype.removeTriggeringOrder = function(onResolved, onRejected) {
	return this.request(ActiveGuidelines.REMOVE_TRIGGER_ORDER, null, onResolved, onRejected) ;
}

ActiveGuidelines.prototype.removeSpecificOrders = function( orderIds, onResolved, onRejected ) {
	var orderIdCommaDelimitedList ;
	if ( typeof orderKeys == 'string' )
		orderIdCommaDelimitedList = orderKeys ;
	else if ( Array.isArray(orderKeys) )
		orderIdCommaDelimitedList = orderKeys.join(",")
	else
		orderIdCommaDelimitedList = Array.prototype.slice.call(arguments).join(",") ;
	return this.request(ActiveGuidelines.REMOVE_SPECIFIC_ORDER, orderIdCommaDelimitedList, onResolved, onRejected ) ;
}

ActiveGuidelines.prototype.postFlowsheetRow = function( floId, rowName, rowValue, aglOverrides, onResolved, onRejected ) {
	var flowsheetRowDetails = { } ;
	
	flowsheetRowDetails[ ActiveGuidelines.PFR_FLOID ] = floId ;
	flowsheetRowDetails[ ActiveGuidelines.PFR_ROWNAME ] = rowName ;
	flowsheetRowDetails[ ActiveGuidelines.PFR_ROWVALUE ] = rowValue ;
	
	if (aglOverrides) for ( var n in aglOverrides ) {
		if ( ActiveGuidelines.PFR_PROPERTIES.optional.indexOf( n ) < 0 )
			this.notifyDebug( "unrecognized property used in postFlowsheetRow(...): " + n ) ;
		flowsheetRowDetails[n] = aglOverrides[n] ;
	}
	
	return this.request(ActiveGuidelines.POST_FLOWSHEET_ROW,flowsheetRowDetails, onResolved, onRejected) ;
}

ActiveGuidelines.prototype.closeActivity = function(onResolved, onRejected) {
	return this.request(ActiveGuidelines.CLOSE_ACTIVITY, null, onResolved, onRejected) ;
}

ActiveGuidelines.prototype.saveState = function( state, onResolved, onRejected ) {
	return this.request(ActiveGuidelines.SAVE_STATE, state, onResolved, onRejected ) ;
}

ActiveGuidelines.prototype.openWindow = function( url, onResolved, onRejected ) {
	return this.request(ActiveGuidelines.OPEN_WINDOW, url, onResolved, onRejected ) ;
}

ActiveGuidelines.prototype.request = function(action, args, onResolved, onRejected) {

	if ( !this.session().listening ) {
		this.session().listening = true ;
		var activeGuidelines = this ;
		window.addEventListener("message", function(evt) { activeGuidelines.receive(evt) ; }, false);
	}

	var activeGuidelines = this ;
	window.setTimeout( function() {
		activeGuidelines.asyncRequest( action, args, onResolved, onRejected ) ;
	},0 ) ;
}

ActiveGuidelines.prototype.asyncRequest = function( action, args, onResolved, onRejected ) {
	if ( this.session().request && this.session().request.pending ) {
	  this.notifyDebug( { "existing request": this.session().request } ) ;
	  reject( new Error( "request still in progress" ) );
	}
	
	this.notifyDebug( { action: action, "this.session().token": this.session().token } ) ;
	if ( action != ActiveGuidelines.HANDSHAKE && !this.session().token )
		  reject( new Error( "cannot request " + action + " without acquiring a token via handshake()" ) );
	
	var request = this.session().request = {
		action: action,
		args: args,
		eventCount: 0,
		pending: true,
		timerId: undefined,
		resolve: function(data) { this.pending = false ; window.clearTimeout( this.timerId ) ; if ( typeof onResolved == 'function' ) onResolved(data) ; }, 
		reject:  function( err) { this.pending = false ; window.clearTimeout( this.timerId ) ; if ( typeof onRejected == 'function' ) onRejected(err ) ; } 
	}

	request.timerId = window.setTimeout( function() {
		request.reject( new Error("no response after 5000ms" ) ) ;
	}, this.config().timeoutMs ) ;

	try {
		
		var message = { action: action, token: this.session().token } ;
		if ( args )
			message.args = args;
		this.notifyDebug( { message: message } ) ;
		window.parent.postMessage(message,this.allowedOrigin());
		
	} catch (ex)  {
  
		this.notifyDebug( ex ) ;
		reject( ex ) ;
	  
	}
}



ActiveGuidelines.prototype.receive = function(evt) {
	var currentRequest = this.session().request ;
	
	if ( !currentRequest.eventCount )
		this.notifyDebug( { origin: evt.origin } ) ;
	
  	++currentRequest.eventCount ;

	for ( var type in evt.data ) {
		this.notifyDebug( { "evt.data": evt.data } ) ;
		
		var contents = evt.data[type] ;
		if ( "token" == type ) {
			
			this.session().token = contents ;
			this.notifyDebug( { token: this.session().token } ) ;
			
		} else if ( "actions" == type ) {
		
			for ( var i in contents ) {
				var action = contents[i] ;
				var onActionSupported = this.config().onActionSupported ;
				var onSpecificActionSupported = this.config().onSpecificActionSupported[action] ;
				if ( typeof onActionSupported == 'function' )
					onActionSupported.call( this, action ) ;
				if ( typeof onSpecificActionSupported == 'function' )
					onSpecificActionSupported.call( this, action ) ;
			}
			
			

		} else if ( "actionExecuted" == type ) {
      
			currentRequest.resolve( contents ) ;
      
		} else if ( "state" == type ) {
        
			if ( typeof this.onStateRestored == 'function' )
				this.onStateRestored.call( this, contents ) ;
			if ( contents )
				this.notifyDebug( { state: contents } ) ;
      
		} else if ( "error" == type ) {
      
			currentRequest.reject( new Error( contents ) ) ;

		} else {
      
			var info = { type: type } ;
			info[type] = contents ;
			this.notifyDebug( info ) ;
			
		}
		
	}
}

ActiveGuidelines.prototype.notifyDebug = function() {
	for ( var i in arguments) {
		var text = arguments[i];
		
		if ( console && typeof console.debug == 'function' )
			console.debug(text);
		
		if (typeof this.config().onDebug == 'function') {
			if (typeof text == 'object' && JSON && typeof JSON.stringify == 'function' )
				text = JSON.stringify(text);
			this.config().onDebug.call(this, text);
		}
	}
};
