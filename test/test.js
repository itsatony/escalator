var esc = require("../lib/escalator");

describe('Escalator', function() {
	var firstStep = null;
	var secondStep = null;
	var lastStep = null;
	var myEscalator = null

	/**
	 *Stuff before running tests
	 */
	beforeEach(function(done) {
		firstStep = {
			id : 'firstStep',
			priority : 1,

			executor : function(next, thisEscelator) {
				// console.log("firststep");
				next();
			}
		};

		secondStep = {
			id : 'secondStep',
			priority : 1,

			executor : function(next, thisEscelator) {
				// console.log("secondstep");
				next();
			}
		};

		lastStep = {
			id : 'lastStep',
			priority : 1,

			executor : function(next, thisEscelator) {
				// console.log("lastStep");
				next();
			}
		};

/**
 *Test aEscalator constructor 
 */		myEscalator = new esc("escalatorId", [firstStep, secondStep]);

		if (myEscalator.id === "escalatorId" && myEscalator.debug === false && myEscalator.catchErrors === false)
			done();
	});

	/**
	 *Test function aEscalator.defaultStep()
	 */
	it('defaultStep', function(done) {
		var defaultStep = myEscalator.defaultStep();

		if ( typeof defaultStep.id === 'string' && typeof defaultStep.priority === 'number' && typeof defaultStep.executor === 'function' && typeof defaultStep.parameters === 'object' && typeof defaultStep.scope === 'object' && typeof defaultStep.resetNeeded === 'boolean' && typeof defaultStep.delay === 'number' && typeof defaultStep.catchErrors === 'boolean')
			done();
	});

	it('add', function(done) {
		myEscalator.add(lastStep);

		if ( typeof myEscalator.steps[lastStep.id] === 'object')
			done();
	});

	/**
	 *Test function aEscalator.reset()
	 */
	it('reset', function(done) {
		myEscalator.reset();
		if (myEscalator.finishedSteps.length == 0 && myEscalator.stepsLeft.length > 0)
			done();
	});	/**
	 *Test function aEscalator.update()
	 */
	it('update', function(done) {
		var size = myEscalator.stepsLeft.length;
		myEscalator.update(lastStep);
		if (myEscalator.stepsLeft.length == size + 1) {
			done();
		}
	});

	/**
	 *Test function aEscalator.remove()
	 */
	it('remove', function(done) {
		var size = myEscalator.stepsLeft.length;
		myEscalator.remove(secondStep.id);

		if (myEscalator.stepsLeft.length == size - 1) {
			done();
		}
	});

	/**
	 *Test function aEscalator.finish()
	 */
	it('finish', function(done) {
		// myEscalator.finish();		done();
	});
	/**
	 *Test function aEscalator.start()
	 */
	it('start', function(done) {
		myEscalator.start();
		done();
	});

	/**
	 *Test function aEscalator.next()
	 */
	// it('next', function (done) {
	// myEscalator.next();
	// });
	/**
	 *Test function aEscalator.sorter()
	 */	it('sorter', function(done) {

		var a = {
			priority : 5
		};
		var b = {
			priority : 5
		};

		if (myEscalator.sorter(a, b) == 0)
			done();

	});
});
