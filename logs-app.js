var structure = {
	type: ["error", "warning", "info", "verbose"],
	source: ["client", "server"]
};
Logs = new Mongo.Collection("logs");

if (Meteor.isServer) {

	/*Logs.allow({
		'insert': function () { return true; }
	});*/
	if (!Logs.find({}).count()) {
		for (var i=0; i < 100; i++)
		{
			var type = structure.type[Math.floor(Math.random() * structure.type.length)];
			Logs.insert({
				type: type,
				message: "some " + type + " message",
				date: (new Date()).toUTCString(),
				source: structure.source[Math.floor(Math.random() * structure.source.length)],
			});
		}
	}
	
	Meteor.publish('logs', function(limit, filter, switcher) {
		if (!switcher)
			return Logs.find(filter, { limit: limit });
		else
			return this.stop();
	});

}

if (Meteor.isClient) {

	var CHUNK = 10;
	Session.setDefault('logsLimit', CHUNK);
	Session.setDefault('switcher', false);
	
	// some kind of observer 
	Deps.autorun(function() {
		Meteor.subscribe('logs', Session.get('logsLimit'), returnFilters(), Session.get('switcher'));
	});
	
	function returnFilters() {
		var obj = {};
		if (Session.get('filterType')) {
			obj.type = Session.get('filterType');
		}
		return obj;
	}
	
	// whenever #needMoreLogs becomes visible
	// retrieve more results, increasing the logsLimits
	function showMoreLogs() {
		var reachTarget, target = $("#needMoreLogs");
		if (!target.length) return;
	 
		reachTarget = $(window).scrollTop() + $(window).height() - target.height();
	 
		if (target.offset().top < reachTarget) {
			if (!target.data("visible")) {
				target.data("visible", true);
				Session.set("logsLimit", Session.get("logsLimit") + CHUNK);
			}
		} else {
			if (target.data("visible")) {
				target.data("visible", false);
			}
		}
	}
	
	$(window).scroll(showMoreLogs);

	Template.lazyExample.helpers({
		logs : function() {
			return Logs.find(returnFilters());
		},
		needMore : function() {
			// returns true till that time
			// when logsLimit overlap the collection size
			return !(Logs.find(returnFilters()).count() < Session.get("logsLimit"));
		}
	});
	
	Template.sidebar.helpers({
		typesFilter : function(){
			return Array.prototype.map.call(structure.type, function(val){
				return { name: val, value: val };
			});
		}
	});
	Template.sidebar.events({
		'change #typeSelect': function (e) {
			if (e.target.value)
				Session.set("filterType", e.target.value);
		},
		"change #serviceSwitcher": function (e) {
			Session.set("switcher", e.target.checked);
		}
	});

}
