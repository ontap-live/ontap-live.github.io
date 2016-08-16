// -- Constant Variables -- //
var _version = {Name : "OnTap.live -> Start", Version : "0.0.1"};

// -- Global Variables -- //

// -- Initial Running Method -- //
$(function() {

	// -- Prevent the Sync/Async XHR Warning -- //
	$.ajaxPrefilter(function( options, originalOptions, jqXHR ) {options.async = true;});
	
	// -- Run -- //
	load_Locations();
	
});

function load_Default(parameter) {
	
	var url = PUBLIC_API_URL + "?callback=?";
	if (parameter) url += ("&" + parameter);
														
	// -- Load Default -- //
	$.ajax({
		type: "GET",
		url: url,
		crossDomain: true,
		contentType: "application/json; charset=utf-8",
		dataType: "json", 
		success: function(data) {
			console.log(data);
		}
	});
	
}

function load_Locations() {
	
	// -- Load Locations -- //
	$.ajax({
		type: "GET",
		url: PUBLIC_API_URL + "?action=locations",
		crossDomain: true,
		contentType: "application/json; charset=utf-8",
		dataType: "jsonp", 
		success: function(data){
			$.each(data.locations, function(index, value) {
				var location = $("<div/>", {
    			id: value.code,
					class: "location"
				}).append($("<h3/>").append($("<a />", {text: value.name, href: "/show?code=" + value.code}))).appendTo("div.content");
			})
		}
	});
	
}