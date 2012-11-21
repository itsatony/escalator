var esc = require("../lib/escalator");
var should = require('should');

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
			priority : 2,

			executor : function(next, thisEscelator) {
				// console.log("secondstep");
				next();
			}
		};

		lastStep = {
			id : 'lastStep',
			priority : 3,
			executor : function(next, thisEscelator) {
				next();
			}
		};

		/**
		 *Test aEscalator constructor
		 */
		myEscalator = new esc("escalatorId", [firstStep, secondStep]);
		should.exist(myEscalator);		done();
	});

  /**
   *Test function aEscalator.finish() 
   */
	it('finish', function(done) {
		myEscalator.onFinish = function() {
			myEscalator.stepsLeft.should.be.empty
			done();
		}
		myEscalator.start();

	});
	/**
	 *Test function aEscalator.defaultStep()
	 */
	it('defaultStep', function(done) {
		var defaultStep = myEscalator.defaultStep();

		defaultStep.id.should.be.a('string');
		defaultStep.priority.should.be.a('number');
		defaultStep.executor.should.be.a('function');
		defaultStep.parameters.should.be.a('object');
		defaultStep.scope.should.be.a('object');
		defaultStep.resetNeeded.should.be.a('boolean');
		defaultStep.delay.should.be.a('number');
		defaultStep.catchErrors.should.be.a('boolean');
		done();
	});

  /**
   *Test function aEscalator.add() 
   */
	it('add', function(done) {
		myEscalator.add(lastStep);

		myEscalator.steps[lastStep.id].should.be.a('object');
		done();
	});
	
	it('add priority', function (done) {
	  
	  myEscalator = new esc('addprioTest', [lastStep, firstStep, secondStep]);

	  myEscalator.stepsLeft[0].id.should.equal(firstStep.id);
	  myEscalator.stepsLeft[1].id.should.equal(secondStep.id);
	  myEscalator.stepsLeft[2].id.should.equal(lastStep.id);
	  myEscalator.start();
		done();
	});

	/**
	 *Test function aEscalator.reset()
	 */
	it('reset', function(done) {
		myEscalator.reset();
		myEscalator.finishedSteps.should.have.length(0);
		myEscalator.stepsLeft.length.should.be.above(0);
		done();
	});	/**
	 *Test function aEscalator.update()
	 */
	it('update', function(done) {
		var size = myEscalator.stepsLeft.length;
		myEscalator.update(lastStep);
		myEscalator.stepsLeft.should.have.length(size + 1);
		done();
	});

	/**
	 *Test function aEscalator.remove()
	 */
	it('remove', function(done) {
		var size = myEscalator.stepsLeft.length;
		myEscalator.remove(secondStep.id);
		myEscalator.stepsLeft.should.have.length(size - 1);
		done();
	});
	/**
	 *Test function aEscalator.start()
	 */
	it('start', function(done) {
		myEscalator.start();
		myEscalator.stepsLeft.length.should.equal(0);
		done();
	});
	/**
	 *Test function aEscalator.sorter()
	 */	it('sorter', function(done) {

		var a = {
			priority : 5
		};
		var b = {
			priority : 5
		};
		myEscalator.sorter(a, b).should.equal(0);
		done();

	});


  /**
   *Test delay on one step with 500ms 
   */
	it('delay next', function(done) {
		var timeFirstStep;
		secondStep.delay = 500;

		firstStep.executor = function(next, thisEscalator) {
			timeFirstStep = new Date();
			next();
		}

		secondStep.executor = function(next, thisEscalator) {
			(new Date() - timeFirstStep).should.be.above(secondStep.delay);
			done();
			next();		}

		myEscalator = new esc('testNextDelay', [firstStep, secondStep]);
		var leftStepsLength = myEscalator.stepsLeft.length;
		myEscalator.start();

	});
	
	/**
	 *Test if the given parameter in lastStep is available in executor 
	 */
	it('step parameter', function (done) {
    lastStep.parameters = ['myparam'];
    lastStep.executor = function (testParam, next, thisEscalator) {
      testParam.should.equal(lastStep.parameters[0]);
    }
    myEscalator = new esc('addprioTest', [lastStep, firstStep, secondStep]);
    myEscalator.start();
    
    done();
  });
});
