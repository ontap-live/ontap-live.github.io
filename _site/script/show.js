// -- Constant Variables -- //
var _version = {Name : "OnTap.live -> Show", Version : "0.0.1"};

// -- Global Variables -- //

// -- Initial Running Method -- //
$(function() {

	// -- Prevent the Sync/Async XHR Warning -- //
	$.ajaxPrefilter(function( options, originalOptions, jqXHR ) {options.async = true;});
	
	// -- Run -- //
	var location = getUrlVars().code;
	if (location) load_Taps(location);
	
});

function load_Taps(location) {
	
	// -- Load Taps -- //
	$.ajax({
		type: "GET",
		url: PUBLIC_API_URL + "?action=show&location=" + location,
		crossDomain: true,
		contentType: "application/json; charset=utf-8",
		dataType: "jsonp", 
		success: function(data){
			
			// Add the Location Name & Link ()
			var location = $("<div/>", {
    			id: data.location.code,
					class: "location"
				}).append($("<h2/>")
									.append($("<a />", {text: data.location.name, href: (data.location.url ? data.location.url : "/show?code=" + data.location.code), target: "_new"})))
				.appendTo("div.content");
			
			$.each(data.taps, function(index, value) {
				var tap = $("<div/>", {
    			id: value.code,
					class: "tap"
				}).append($("<h4/>", {})
									.append($("<a />", {class: value.type.toLowerCase(), text: value.name, href: (value.link ? value.link : value.style_link), target: "_new"})))
				.appendTo("div.content");
				
				var _text = "";
				
				if (value.style) {
					if (_text) _text += ". ";
					_text += "<strong>" + value.style + "</strong>";
				}
				
				if (value.provider) {
					if (_text) _text += ". "
					_text += ("From " + value.provider);
				}
				if (value.abv) {
					if (_text) _text += ". "
					_text += ("ABV: " + (Math.round(value.abv * 1000) / 10) + "%");
				}
				
				tap.append($("<p/>").html(_text));
				
				if (value.cost) {tap.append($("<p/>", {class: "cost"}).html("£<strong>" + value.cost.toFixed(2) + "</strong> per " + (value.unit ? value.unit.toLowerCase() : "pint")));}
				
			})
			
		}
	});
	
}