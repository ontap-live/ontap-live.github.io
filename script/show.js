// -- Constant Variables -- //
var _version = {Name : "OnTap.live -> Show", Version : "0.0.1"};

// -- Global Variables -- //
var _location;
var _auth = false;
var _canEdit = false;

// -- Initial Running Method -- //
$(function() {

	// -- Prevent the Sync/Async XHR Warning -- //
	$.ajaxPrefilter(function( options, originalOptions, jqXHR ) {options.async = true;});
	
	// -- Run -- //
	_location = getUrlVars().code;
	if (_location) get_Taps(_location);
	
	// -- Auth Handlers -- //
	startAuthFlow(
		function(user) {
			/*
			user.getId()
			user.getName()
			user.getGivenName()
			user.getFamilyName()
			user.getImageUrl()
			user.getEmail()
			*/
			_auth = true;
			$("#login").remove();
			var logout = $("<a />", {
				id: "logout",
				class: "key auth",
				text: user.getName(),
				href: "#",
			}).click(function(e) {e.preventDefault(); return signOut();}).appendTo("div.content");
			
			show_EditTaps();
			
		},
		function() {
			_auth = false
			_canEdit = false;
			$("#logout").remove();
			var login = $("<a />", {
				id: "login",
				class: "key auth",
				text: "Sign In",
				href: "#",
			}).click(function(e) {e.preventDefault(); return signIn();}).appendTo("div.content");
			
			show_EditTaps();
		}
	);
	
});

function get_Taps(location) {
	
	// -- Load Taps [Locally] -- //
	localforage.getItem("taps__" + location).then(function(local_data) {
		if (local_data) show_Data(local_data, show_Taps, "Local");
		load_Taps(location, local_data ? local_data.last_update : "",
							local_data ? local_data.schema_version : "")
	}).catch(function(reason) {load_Taps(location);});
	
}

function load_Taps(location, local_data_updated, local_data_schema_version) {
	
	// -- Load Taps [Remotely] -- //
	$.ajax({
		type: "GET",
		url: PUBLIC_API_URL + "?action=show&location=" + location,
		crossDomain: true,
		contentType: "application/json; charset=utf-8",
		dataType: "jsonp", 
		success: function(data) {
			if (data && (!local_data_updated ||
									 !local_data_schema_version ||
									 !data.last_update ||
									 moment(data.last_update).isAfter(local_data_updated) ||
									 data.schema_version > local_data_schema_version)) {
				localforage.setItem("taps__" + location, data).then(function() {
					show_Data(data, show_Taps, "Remote");
				}).catch(function(err) {
					show_Data(data, show_Taps, "Remote [Set ERR]");
				});
			}
		}
	});
	
}

function show_EditTaps() {
	if (_auth && _location) {
		if (_canEdit) {
			mark_EditTaps(_canEdit);
		} else {
			callEndpointAPI("canEdit", [_location], function(value) {
				
				_canEdit = value.result;
				mark_EditTaps(_canEdit);
				
			}, $("output"));
		}
	} else {
		mark_EditTaps(false);
	}
}

function mark_EditTaps(editable) {
	$(".tap").each(function(index, value) {
		value = $(value);
		if (editable === true) {
			value.addClass("editable");
			var login = $("<a />", {
				class: "edit",
				text: "change",
				href: "#",
			}).click((function(tap_Id, current_Set, location) {
								return function(e) {
									e.preventDefault();
									
									callEndpointAPI("options", [location], function(value) {
										$("#" + tap_Id).children(".edit").hide();
										var _selector = $("<select />", {id: tap_Id + "_select", class: "taps"});
										var _replace = $("#" + tap_Id).children("h4").first();
										_replace.replaceWith(_selector);	
										_selector.selectize(
											{
												placeholder : "What is now on tap?",
												labelField : "name",
												sortField: "name",
												searchField: ["name", "provider"],
												closeAfterSelect : true,
												options : value.result.options,
												render: {
													item: function(item, escape) {
														return "<div>" +
															(item.name ? "<span class='name'>" + escape(item.name) + "</span>" : "") +
															(item.provider ? "<span class='provider'>" + escape(item.provider) + "</span>" : "") + "</div>";
													},
													option: function(item, escape) {
														var label = item.name || item.provider;
														var caption = item.name ? item.provider : null;
														return "<div>" +
															"<span class='label'>" + escape(label) + "</span>" +
															(caption ? "<span class='caption'>" + escape(caption) + "</span>" : "") + "</div>";
													}
												},
												create: false,
												onChange: function(value) {
													if (!value.length || value == current_Set) return;
													this.disable();
													callEndpointAPI("setChange", [location, tap_Id, value], function(value) {
														if (value.result && value.result !== false) {
															localforage.setItem("taps__" + location, value.result).then(function() {
																show_Data(value.result, show_Taps, "Remote / Change");
																mark_EditTaps(true);
															}).catch(function(err) {
																show_Data(value.result, show_Taps, "Remote / Change [Set ERR]");
																mark_EditTaps(true);
															});
														}
													});
												}
											}
										);
										var _cancel = $("<a />", {id: tap_Id + "_cancel", text: "cancel", class: "cancel", href: "#"})
											.click(function(e) {
													e.preventDefault();
													$(".selectize-control").remove();
													_selector.replaceWith(_replace);
													_cancel.remove();
													$("#" + tap_Id).children(".edit").show();
												});
										$(".selectize-control").after(_cancel);
									}, $("output"));
								};
							})(value.attr("id"), value.children("h4").first().text(), _location)).prependTo(value);
		} else {
			value.removeClass("editable");
			value.children(".edit").remove();
		}
	});
}

function show_Taps(data) {
	
	if (data.location && data.taps) {
		
		$("div.location, div.tap").remove();
		
		// Add the Location Name & Link ()
		var location = $("<div/>", {
				id: data.location.code,
				class: "location"
			}).append($("<h2/>")
				.append($("<a />", {text: data.location.name, href: (data.location.url ? data.location.url : "/show?code=" + data.location.code), target: "_new"})))
				.appendTo("div.content");
		
		/*
		if (data.location.place) {
			$.ajax({
				type: "GET",
				url: PLACES_API_ENDPOINT + "?placeid=" + data.location.place + "&key=" + PLACES_API_KEY,
				contentType: "application/json; charset=utf-8",
				dataType: "jsonp",
				success: function(result) {
					console.log(result);
					if (result.result.opening_hours.open_now) {alert("OPEN NOW");}
				}
			});
		}
		*/
		
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
}