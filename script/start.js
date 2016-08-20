// -- Constant Variables -- //
var _version = {Name : "OnTap.live -> Start", Version : "0.0.1"};

// -- Global Variables -- //

// -- Initial Running Method -- //
$(function() {

	// -- Prevent the Sync/Async XHR Warning -- //
	$.ajaxPrefilter(function( options, originalOptions, jqXHR ) {options.async = true;});
	
	// -- Run -- //
	get_Locations();
	
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

function get_Locations() {
	
	// -- Load Locations [Locally] -- //
	localforage.getItem("locations").then(
		function(local_data) {
			if (local_data) show_Data(local_data, show_Locations, "Local");
			load_Locations(local_data ? local_data.last_update : "",
										 local_data ? local_data.schema_version : "")
		}
	).catch(
		function(reason) {
			show_Error(reason);
			load_Locations();
		}
	);
	
}

function load_Locations(local_data_updated, local_data_schema_version) {
	
	// -- Load Locations [Remotely] -- //
	$.ajax({
		type: "GET",
		url: PUBLIC_API_URL + "?action=locations",
		crossDomain: true,
		contentType: "application/json; charset=utf-8",
		dataType: "jsonp", 
		success: function(data) {
			if (data && (!local_data_updated || 
									 !local_data_schema_version ||
									 !data.last_update ||
									 moment(data.last_update).isAfter(local_data_updated) ||
									 data.schema_version > local_data_schema_version)) {
				localforage.setItem("locations", data).then(function(value) {
					show_Data(data, show_Locations, "Remote");
				}).catch(function(err) {
					show_Data(data, show_Locations, "Remote [Set ERR]");
				});
			}
		}
	});
	
}

function show_Locations(data) {
	if (data.locations) {
		$("div.location").remove();
		$.each(data.locations, function(index, value) {
			var location = $("<div/>", {
				id: value.code,
				class: "location"
			}).append($("<h3/>").append($("<a />", {text: value.name, href: "/show?code=" + value.code + (URL_VARS && URL_VARS.debug ? "&debug" : "")}))).appendTo("div.content");
			if (value.logo) location.append($("<img />", {src: value.logo}))
		})
	}
}