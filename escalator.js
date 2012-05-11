/* ----------------------------------------------------------------------------
 * ----------------------------------------------------------------------------
 *	TITLE: escalator - a flow-control class for javascript (nodeJS & browser)
 *
 *	DESCRIPTION: 
 * -  this code is part of the VisualWeb Project by 
 *	-  LinkCloud ( http://www.mylinkcloud.com )
 *	-  ViSERiON UG (haftungsbeschraenkt) ( http://www.viserion.com )  
 * -  K!Lab GmbH ( http://www.klab-berlin.com )
 * -  MIT license. 
 *
 *		in async environments - we do love them - there are times when you need to make sure foo is run after bar in all cases.
 *		for our VisualWeb framework we thus developed a object/class called escalator that allows us to write sequential code.
 *
 *	BASED ON:
 *		nothing really... it's quite different from the flow control systems i found after i had written this...
 *
 *	FILE (in VisualWeb): 
 *		/public/vw.escalator.js
 *
 * AUTHOR: 
 *		 Toni Wagner @itsatony
 * 		
 * DEPENDENCIES:
 *		- dependencies were removed ... this is totally independent now .
 *		- it should integrate into NodeJS on the server-side or any browser-side with javascript enabled.
 *
 *	TESTS: 
 *	(start code)
 *		none yet ;)
 * (end)
 *
 *	VERSION:
 *		- v0.1.0	initial public release		08.05.2012			
 *			- removed dependencies 
 *			- enabled using the same file for client- and nodeJS server-side implementation
 *
 *	URLs:
 *		- blogpost: <http://coffeelog.itsatony.com/escalator>
 *		- github: <https://github.com/itsatony/escalator>
 *
 *	examples:
 *	
 *	#1 - three steps, different configs  
 *	(start code)
 	var someVar = 'hello';
 	var firstStep = {
		id: 'myFirstStep',
		priority: 10,
		executor: function(next, thisEscalator) {
			someVar = 'hello too'
			next();
		}
	};
	var secondStep = {
		id: 'mySecondStep',
		priority: 20,
		delay: 10,
		parameters: [ someVar ],
		scope: this,
		executor: function(somethingWePassedIn, next, thisEscalator) {
			console.log(somethingWePassedIn);
			thisEscalator.anotherVariable = 42;
			next();
		}
	};	
	var lastStep = {
		priority: 22,
		executor: function(next, thisEscalator) {
			console.log(thisEscalator.anotherVariable);
			next();
		}
	};
	var myDemoEscalator = new escalator(
		'demoEscalator',
		[ firstStep, secondStep, lastStep ]
	).start();
 * 	(end)
 *
 * ---------------------------------------------------------------------------- */ 



/* -----------------------------------------------------------------
 *	class: escalator 
 *		an object that runs functions synchronously - one step after the next ...
 *
 *	parameters: 
 *		id - {string} the id of the escalator
 *		steps - {array} optional. if an array of step objects (format see <aEscalator.prototype.defaultStep>) is passed, they will all be added.
 *		
 *	returns: 
 * 	this - {object}
 *
 *	------------------------------------------------------------------*/
var aEscalator = function(id, steps, debug) {
	this.id = (id) ? id : VisualWebClient.funcs.makeId(6);
	this.debug = (typeof debug == 'boolean') ? debug : false;
	this.steps = {};
	this.stepsLeft = [];
	if (jQuery.isArray(steps)) {
		for (var i = 0; i < steps.length; i++) {
			this.add(steps[i]);
		}
	}
	return this;
};


/* -----------------------------------------------------------------
 *	method: aEscalator.prototype.defaultStep
 *		returns a default step object will all needed attributes
 *
 *	parameters: 
 *
 *	returns: 
 * 	aStep - {object}
 *
 *	------------------------------------------------------------------*/
aEscalator.prototype.defaultStep = function() {
	var aStep = {
		id: VisualWebClient.funcs.makeId(4), 
		priority: (this.stepsLeft.length + 1) * 10, 
		executor: function(next) { next(); return true; }, 
		parameters: [], 
		scope: document, 
		resetNeeded: false,
		delay: 0
	};
	return aStep;
};


/* -----------------------------------------------------------------
 *	method: aEscalator.prototype.add
 *		an object that runs function synchronously - one step after the next ...
 *
 *	parameters: 
 *		id - {string || object} - if this is an object, all the step parameters need to be attributes. see <aEscalator.prototype.defaultStep>. additional arguments will be ignored.
 *		priority - {number}
 *		executor - {function}
 *		parameters - {array} executor will receive these arguments
 *		scope - {object} executor will get this scope applied. defaults to this
 *		delay - {number} ms to wait before taking the next step
 *
 *	returns: 
 * 	this - {object}
 *
 *	------------------------------------------------------------------*/
aEscalator.prototype.add = function(id, priority, executor, parameters, scope, resetNeeded, delay) {
	var thisEscalator = this;
	var defaultStep = this.defaultStep();
	if (typeof arguments[0] == 'object' && typeof arguments[0].id == 'string') {
		var thisStep = arguments[0];
	} else {
		var thisStep = {
			id: id,
			priority: priority,
			executor: executor,
			parameters: parameters,
			scope: scope,
			resetNeeded: resetNeeded,
			delay: delay
		};
	}
	var newStep = {};
	jQuery.extend(true, newStep, defaultStep, thisStep);
	if (jQuery.isFunction(newStep.executor) != true) return false;
	if (typeof newStep.priority != 'number') newStep.priority = (this.stepsLeft.length + 1) * 10;
	if (jQuery.isArray(newStep.parameters) != true) newStep.parameters = [];
	if (typeof newStep.scope != 'object') newStep.scope = document;
	newStep.parameters.push(function() {
		thisEscalator.next();
	});
	this.steps[newStep.id] = newStep;
	if (newStep.resetNeeded) this.reset();
	else this.update(this.steps[id]);
	return this;
};


/* -----------------------------------------------------------------
 *	method: aEscalator.prototype.reset
 *		reset this escalator - all steps are sorted by prio and added to a (pre-emptied) this.stepsLeft array
 *
 *	parameters: 
 *
 *	returns: 
 * 	this - {object}
 *
 *	------------------------------------------------------------------*/
aEscalator.prototype.reset = function() {
	this.stepsLeft = [];
	this.finishedSteps = [];
	for (var i in this.steps) {
		this.stepsLeft.push(this.steps[i]);
	}
	this.stepsLeft.sort(this.sorter);
	return this;
};

/* -----------------------------------------------------------------
 *	method: aEscalator.prototype.reset
 *		reset this escalator - all steps are sorted by prio and added to a (pre-emptied) this.stepsLeft array
 *
 *	parameters: 
 *
 *	returns: 
 * 	this - {object}
 *
 *	------------------------------------------------------------------*/
aEscalator.prototype.update = function(newStep) {
	this.stepsLeft.push(newStep);
	this.stepsLeft.sort(this.sorter);
	return this;
};

/* -----------------------------------------------------------------
 *	method: aEscalator.prototype.remove
 *		remove a step - this will auto-trigger a reset: <aEscalator.prototype.reset>
 *
 *	parameters: 
 *		id - {string}
 *
 *	returns: 
 * 	this - {object}
 *
 *	------------------------------------------------------------------*/
aEscalator.prototype.remove = function(id) {
	delete this.steps[id];
	this.reset();
	return this;
};

/* -----------------------------------------------------------------
 *	method: aEscalator.prototype.finish
 *		triggers a finished event!
 *
 *	parameters: 
 *		id - {string}
 *
 *	returns: 
 * 	this - {object}
 *
 *	------------------------------------------------------------------*/
aEscalator.prototype.finish = function() {
	if (this.debug == true ) console.log('[escalator] {' + this.id + '} triggered FISHED!');
	if (jQuery.isFunction(this.onFinish)) this.onFinish(this);
	return this;
};


/* -----------------------------------------------------------------
 *	method: aEscalator.prototype.start
 *		triggers a succession of <aEscalator.prototype.reset> and <aEscalator.prototype.next>
 *
 *	parameters: 
 *
 *	returns: 
 * 	this - {object}
 *
 *	------------------------------------------------------------------*/
aEscalator.prototype.start = function() {
	if (this.debug == true) console.log('[escalator] {' + this.id + '} triggered START!');
	this.reset();
	this.next();
	return this;
};


/* -----------------------------------------------------------------
 *	method: aEscalator.prototype.next
 *		move to the next step
 *
 *	parameters: 
 *
 *	returns: 
 * 	this - {object}
 *
 *	------------------------------------------------------------------*/
aEscalator.prototype.next = function() {
	if (jQuery.isArray(this.stepsLeft) != true) return this;
	if (this.stepsLeft.length < 1) {
		return this.finish();
	}
	var thisStep = this.stepsLeft.shift();
	this.finishedSteps.push(thisStep);
	//console.dir(thisStep);
	if (this.debug == true) console.log('[escalator] {' + this.id + '} triggered NEXT step: (' + thisStep.id + ')');
	try {
		if (thisStep.delay > 0) {
			thisStep.timeout = setTimeout(
				function() { thisStep.executor.apply(thisStep.scope, thisStep.parameters); },
				thisStep.delay
			);
		} else {
			thisStep.executor.apply(thisStep.scope, thisStep.parameters);
		}
	} catch(err) {
		console.log('[escalator] {' + this.id + '} triggered ERROR during step: (' + thisStep.id + ')');
		console.dir(err);	}
	return this;
};


/* -----------------------------------------------------------------
 *	method: aEscalator.prototype.sorter
 *		this is a sorting function used for this.stepsLeft array of objects.
 *
 *	parameters: 
 *		a - {object}
 *		b - {object}
 *
 *	returns: 
 * 	a.priority - b.priority - {number}
 *
 *	------------------------------------------------------------------*/
aEscalator.prototype.sorter = function(a,b) {
	return a.priority - b.priority;
};



// ------------------ here we send our class to the browser, nodeJS modules, VisualWebClient, or whereever you are!
;(function() {
	// if we are in nodeJS ... 
	if (typeof exports !== 'undefined') {
		if (typeof module !== 'undefined' && module.exports) {
			module.exports = aEscalator;
		}
	} else {
		if (typeof VisualWebClient == 'object') {
			VisualWebClient.classes.escalator = aEscalator;
		} else {
			// Exported as a string, for Closure Compiler "advanced" mode.
			// Establish the root object, `window` in the browser, or `global` on the server.
			var root = this;
			var escalator = aEscalator;
			root['escalator'] = aEscalator;
		}
	}	
})();


;
