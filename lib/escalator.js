/* ----------------------------------------------------------------------------
 * ----------------------------------------------------------------------------
 *	TITLE: escalator - a flow-control class for javascript (nodeJS & browser)
 *
 *	DESCRIPTION: 
 * -  this code is part of the VisualWeb Project by 
 *	-  myLinkCloud ( https://mylinkcloud.com )
 *	-  ViSERiON UG (haftungsbeschraenkt) ( http://www.viserion.com )  
 * -  K.Lab GmbH ( http://www.klab-berlin.com )
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
 *		- v0.2.5	fixes to default add values		18.12.2013	
 *		- v0.2.4	fixes to default add values		18.12.2013	
 *		- v0.2.3	fixes to default add values		18.12.2013	
 *		- v0.2.2	fixes to default add values		18.12.2013	
 *		- v0.2.0	initial public release		15.11.2012	
 *			- bug fixes
 *			- better error handling of steps
 *			- optional try-catching of steps (allows for js engines to run optimizations if turned off)
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
 *	class: aEscalator 
 *		an object that runs function synchronously - one step after the next ...
 *
 *	parameters: 
 *		id - {string} the id of the escalator
 *		steps - {array} optional. if an array of step objects (format see <aEscalator.prototype.defaultStep>) is passed, they will all be added.
 *		
 *	returns: 
 * 	this - {object}
 *
 *	------------------------------------------------------------------*/
var aEscalator = function(id, steps, debug, catchErrors) {
	this.version = '0.2.8';
	this.state = 'instantiated';
	this.onError = false;
	if (typeof id === 'undefined') {
		this.id = 'esc_' + Date.now() + '_' + Math.floor(Math.random()*10000);
	} else if (typeof id === 'object' && typeof id.length === 'number') {
		steps = id;
		this.id = 'esc_' + Date.now() + '_' + Math.floor(Math.random()*10000);
	} else {
		this.id = id;
	}
	this.debug = (typeof debug === 'boolean') ? debug : false;
	this.catchErrors = (typeof catchErrors === 'boolean') ? catchErrors : false;
	this.steps = {};
	this.stepsLeft = [];
	if (typeof steps === 'object' && typeof steps.length === 'number' && typeof steps.sort === 'function') {
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
		id: 'esc_' + Date.now() + '_' + Math.floor(Math.random()*10000000), 
		priority: (getHighestPrio(this.steps) + 1) * 10, 
		executor: function(next) { next(); return true; }, 
		parameters: [], 
		scope: (typeof process === 'object') ? process : window, 
		resetNeeded: false,
		delay: 0,
		catchErrors: false
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
	var randomId = 'step_' + Date.now() + '_' + Math.floor(Math.random()*10000);
	var thisStep = {
		id: randomId
	};
	if (typeof arguments[0] === 'function') {
		thisStep.executor = arguments[0];		
	}	else if (typeof arguments[0] === 'object' && typeof arguments[0].executor === 'function') {
		thisStep = arguments[0];
		if (typeof thisStep.id !== 'string') {
			thisStep.id = randomId;
		}
	} else {
		thisStep = {
			id: id,
			priority: priority,
			executor: executor,
			parameters: parameters,
			scope: scope,
			resetNeeded: resetNeeded,
			delay: delay,
			catchErrors: false
		};
	}
	var newStep = {};
	for (var i in defaultStep) {
		newStep[i] = defaultStep[i];
	}
	for (var i in thisStep) {
		newStep[i] = thisStep[i];
	}
	
	if (typeof newStep.executor !== 'function') {
		if (this.debug === true) {
			console.log('[escalator] no executor function! ' + newStep.id);
		}
		return false;
	}
	if (typeof newStep.priority !== 'number') {
		var highest = getHighestPrio(this.steps);
		newStep.priority = (highest + 1) * 10;
	}
	if (typeof newStep.parameters !== 'object' || typeof newStep.parameters.length !== 'number') {
		newStep.parameters = [];
	}
	if (typeof newStep.scope !== 'object') {
		newStep.scope = (typeof process === 'object') ? process : window;
	}
	newStep.parameters.push(function() {
		thisEscalator.next();
	});
	newStep.parameters.push(thisEscalator);
	if (this.debug === true) {
		console.log('[escalator] {' + this.id + '} step added: ' + newStep.id);
	}
	this.steps[newStep.id] = newStep;
	if (newStep.resetNeeded) {
		this.reset();
	}	else {
		this.update(this.steps[newStep.id]);	
	}
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
	this.state = 'reset';
	this.stepsLeft = [];
	this.finishedSteps = [];
	for (var i in this.steps) {
		this.stepsLeft.push(this.steps[i]);
	}
	this.stepsLeft.sort(this.sorter);
	return this;
};


/* -----------------------------------------------------------------
 *	method: aEscalator.prototype.update
 *		reset this escalator - all steps are sorted by prio and added to a (pre-emptied) this.stepsLeft array
 *
 *	parameters: 
 *		newStep - {object} adds a new Step and triggers a resort.
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
aEscalator.prototype.finish = function(err) {
	if (this.state === 'finished') {
		if (this.debug === true) {
			console.log('[escalator] PROBLEM!??? ====> {' + this.id + '} ====> triggered FINISH AGAIN!?!');
		}
	}
	this.state = 'finished';
	if (typeof err !== 'undefined') {
		if (this.debug === true) {
			console.log('[escalator] {' + this.id + '} triggered FINISHED WITH ERROR!!!');
		}
		this.error = err;
	} else {
		if (this.debug === true) {
			this.finishTime = Date.now();
			console.log('[escalator] {' + this.id + '} triggered FINISHED in {' + (this.finishTime - this.startTime) + 'ms}');
		}
	}
	if (typeof this.onFinish === 'function') {
		this.onFinish(this);
	}
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
	if (this.debug === true) {
		console.log('[escalator] {' + this.id + '} triggered START!');
		this.startTime = Date.now();
		this.lastStepFinishedAt = Date.now();
	}
	this.reset();
	this.state = 'running';
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
	if (typeof this.stepsLeft !== 'object' || typeof this.stepsLeft.length !== 'number') return this;
	if (this.stepsLeft.length < 1) {
		return this.finish();
	}
	var thisEscalator = this;
	var thisStep = this.stepsLeft.shift();
	this.currentStepId = thisStep.id;
	if (this.debug === true) {
		var now = Date.now();
		thisStep.elapsed = now - this.lastStepFinishedAt;		
		this.lastStepFinishedAt = now;
		console.log('[escalator] {' + this.id + '} triggered NEXT step: (' + thisStep.id + ') in {' + thisStep.elapsed + 'ms}');
	}
	this.finishedSteps.push(thisStep);
	var myParameters = [];
	for (var i in arguments) { myParameters.push(arguments[i]); };
	for (var i in thisStep.parameters) { myParameters.push(thisStep.parameters[i]); };
	
	if (typeof this.onError === 'function' || this.catchErrors === true || thisStep.catchErrors === true) {
		try {
			if (thisStep.delay > 0) {
				thisStep.timeout = setTimeout(
					function() { thisStep.executor.apply(thisStep.scope, myParameters); },
					thisStep.delay
				);
			} else {
				thisStep.executor.apply(thisStep.scope, myParameters);
			}
		} catch(err) {
			console.log('[escalator] {' + this.id + '} triggered ERROR during step: (' + thisStep.id + ')');
			console.log(err);
			if (typeof err.stack !== 'undefined') {
				console.log(err.stack);
			}
			if (typeof thisEscalator.onError === 'function') {
				thisEscalator.onError.apply(thisEscalator, [ err, thisEscalator ]);
			} else if (typeof thisStep.onError === 'function') {
				thisStep.onError.apply(thisEscalator, [ err, thisEscalator ]);
			} else {
				thisEscalator.finish(err);
			}
		}
	} else {
		if (thisStep.delay > 0) {
			thisStep.timeout = setTimeout(
				function() { thisStep.executor.apply(thisStep.scope, myParameters); },
				thisStep.delay
			);
		} else {
				thisStep.executor.apply(thisStep.scope, myParameters);
		}
	}
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


function getHighestPrio(steps) {
	var highest = 0;
	for (var i in steps) {
		if (typeof steps[i].priority === 'number' && steps[i].priority > highest) {
			highest = steps[i].priority;
		}
	}
	return highest;
};


// ------------------ here we send our class to the browser, nodeJS modules, VisualWebClient, or whereever you are!
;(function() {
	// if we are in nodeJS ... 
	if (typeof exports !== 'undefined') {
		if (typeof module !== 'undefined' && module.exports) {
			module.exports = aEscalator;
		}
	} else {
		if (typeof VisualWebClient === 'object') {
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
