// -- Set Up & Parse URL Vars -- //
var URL_VARS = getUrlVars();
// -- Set Up & Parse URL Vars -- //

// -- Set Up Public Endpoint -- //
var PUBLIC_API_URL = "https://script.google.com/macros/s/AKfycbwJdg1jPsWyBbtKolfvR1osqCmrgMX88seDfqwIXC_BBO7QW6o/exec";
// -- Set Up Public Endpoint -- //

// -- Set Up API Google Scopes & IDs -- //
var API_CLIENT_ID = "1094511926464-6liipv1s2mn8lg1ugcgcn88h8sjdoma2.apps.googleusercontent.com";
var API_ENDPOINT_ID = "MNq4OhTWwO8cKn5U-Fv9O5FUssP2KT1jI";
var API_SCOPES = [
	"https://www.googleapis.com/auth/drive",
	"https://www.googleapis.com/auth/userinfo.email",
];
// -- Set Up API Google Scopes & IDs -- //


// -- Authorisation Methods -- //
var AUTH_SUCCESS, AUTH_FAILURE, AUTH_LOADED;
function registerAuthHandlers(success, failure, loaded) {
	AUTH_SUCCESS = success;
	AUTH_FAILURE = failure;
	AUTH_LOADED = loaded;
}

function checkAuth() {
	handleAuth(null, true);
}

function handleAuth(username, immediate) {

	gapi.auth.authorize({
		client_id : API_CLIENT_ID,
		scope : API_SCOPES,
		immediate : !immediate ? false : immediate,
		user_id : username,
	}, function(result) {
		if (result && !result.error && AUTH_SUCCESS) {AUTH_SUCCESS();}
		else if (AUTH_FAILURE) {AUTH_FAILURE();}
	}).then(AUTH_LOADED());
	
	return false;
	
}
// -- Authorisation Methods -- //


// -- API Methods -- //
function callEndpointAPI(method, parameters, callback, messagesOutput) {
	var request = {
		function : method,
		parameters : parameters,
	};
	if (URL_VARS.dev) request.devMode = true;

	var op = gapi.client.request({
		root : "https://script.googleapis.com",
		path : "v1/scripts/" + API_ENDPOINT_ID + ":run",
		method : "POST",
		body : request
	});

	op.execute(function(resp) {
		handleAPIResponse(resp, callback, messagesOutput);
	});
}

function handleAPIResponse(resp, callback, messagesOutput) {

	if (resp.error && resp.error.status) {
		// API encountered a problem before the script started executing.
		if (resp.error.status == "UNAUTHENTICATED") {
			gapi.auth.authorize({
				client_id : API_CLIENT_ID,
				scope : API_SCOPES,
				immediate : true,
			}, function(result) {
				if (result && !result.error && AUTH_SUCCESS) {AUTH_SUCCESS()}
				else if (AUTH_FAILURE) {AUTH_FAILURE(result ? result.error : null)}
			});
		} else {
			showMessages("Error calling API:", messagesOutput);
			showMessages(JSON.stringify(resp, null, 2), messagesOutput);
			AUTH_FAILURE();
		}
	} else if (resp.error) {
		// API executed, but the script returned an error.
		// Extract the first (and only) set of error details.
		// The values of this object are the script's 'errorMessage' and
		// 'errorType', and an array of stack trace elements.
		var error = resp.error.details[0];
		showMessages('Script error message: ' + error.errorMessage, messagesOutput);
		if (error.scriptStackTraceElements) {
			// There may not be a stacktrace if the script didn't start executing.
			showMessages("Script error stacktrace:", messagesOutput);
			for (var i = 0; i < error.scriptStackTraceElements.length; i++) {
				var trace = error.scriptStackTraceElements[i];
				showMessages('\t' + trace.function+':' + trace.lineNumber, messagesOutput);
			}
		}
	} else {

		// The structure of the result will depend upon what the Apps Script function returns.
		if (getUrlVars().debug) console.log(resp.response.result);
		if (callback) callback(resp.response.result);
	}

}

function showMessages(messages, output) {
	if (messages &&  typeof messages === "string") messages = [messages];
	var _output = $("<pre />").appendTo(output.find(".content"));
	for (var i = 0; i < messages.length; i++) {
		console.log(messages[i]);
		_output.text(_output.text() + messages[i] + '\n');
	}
}
// -- API Methods -- //


// -- General Methods -- //
function getUrlVars()
{
	var vars = [], hash;
	
	var _params = window.location.href.slice(window.location.href.indexOf('?') + 1), params;
	if (_params.indexOf("/#") >= 0) {
		params = _params.substring(0, _params.indexOf("/#")).split('&');
	} else if (_params.indexOf("#") >= 0) {
		params = _params.substring(0, _params.indexOf("#")).split('&');
	} else {
		params = _params.split('&');	
	}
	
	for(var i = 0; i < params.length; i++)
	{
		if (params[i].indexOf("=") >= 0) {
			param = params[i].split("=");
			vars.push(param[0]);
			vars[param[0]] = param[1];
		} else {
			vars.push(params[i]);
			vars[params[i]] = true;
		}

	}
	
	return vars;
}
// -- General Methods -- //

// -- Display Methods -- //
function show_Data(data, displayFunction, source) {
	
	if (data) {
		
		displayFunction(data);
		
		$("div.meta").remove();
		
		if (URL_VARS && URL_VARS.debug) {
			
			var _meta = $("<div/>", {
				class: "meta"
			}).appendTo("div.content");
			
			if (data.last_update) $("<div />", {
					id: "last_update",
					text: "Changed: " + moment(data.last_update).toString()
				}).appendTo(_meta);
			
			if (source) $("<div />", {
					id: "source",
					text: "From: " + source
				}).appendTo(_meta);

		}
	}
}
// -- Display Methods -- //