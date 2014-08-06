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
		should.exist(myEscalator);
		done();
	});

  /**
   *Test function aEscalator.finish() 
   */
	it('finish', function(done) {
		myEscalator.onFinish = function() {
			myEscalator.stepsLeft.should.be.empty;
			done();
		}
		myEscalator.start();

	});
	/**
	 *Test function aEscalator.defaultStep()
	 */
	it('defaultStep', function(done) {
		var defaultStep = myEscalator.defaultStep();

		defaultStep.id.should.be.type('string');
		defaultStep.priority.should.be.type('number');
		defaultStep.executor.should.be.type('function');
		defaultStep.parameters.should.be.type('object');
		defaultStep.scope.should.be.type('object');
		defaultStep.resetNeeded.should.be.type('boolean');
		defaultStep.delay.should.be.type('number');
		defaultStep.catchErrors.should.be.type('boolean');
		done();
	});

  /**
   *Test function aEscalator.add() 
   */
	it('add', function(done) {
		myEscalator.add(lastStep);

		myEscalator.steps[lastStep.id].should.be.type('object');
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
		myEscalator.finishedSteps.length.should.equal(0);
		myEscalator.stepsLeft.length.should.be.above(0);
		done();
	});

	/**
	 *Test function aEscalator.update()
	 */
	it('update', function(done) {
		var size = myEscalator.stepsLeft.length;
		myEscalator.update(lastStep);
		myEscalator.stepsLeft.length.should.equal(size + 1);
		done();
	});

	/**
	 *Test function aEscalator.remove()
	 */
	it('remove', function(done) {
		var size = myEscalator.stepsLeft.length;
		myEscalator.remove(secondStep.id);
		myEscalator.stepsLeft.length.should.equal(size - 1);
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
	 */
	it('sorter', function(done) {

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
   *test shortCut add of executor function
   */
	it('shortCut add', function(done) {
		var anEscalator = new esc('shortCutAdd', []);		
		anEscalator.add(
			function(n, tE) {
				n();
				done(); 				
			}
		);		
		anEscalator.start();		
	});
	
	
  /**
   *test onError
   */
	it('onError', function(done) {
		var anEscalator = new esc('testOnError', []);		
		anEscalator.add(
			function(n, tE) { 
				throw new Error("some test error");
				n();
			}
		);		
		anEscalator.onError = function(err, thisEsc) {
			thisEsc.finish();
			done();
		};
		anEscalator.start();		
	});
	
	
  /**
   *Test delay on one step with 500ms 
   */
	it('delay next', function(done) {
		var timeFirstStep;
		var firstStep = {};
		var secondStep = {};
		firstStep.executor = function(next, thisEscalator) {
			timeFirstStep = new Date();
			next();
		};
		secondStep.delay = 500;
		secondStep.executor = function(next, thisEscalator) {
			(new Date() - timeFirstStep).should.be.above(secondStep.delay-1);
			next();
			done();
		};
		var anEscalator = new esc('testNextDelay', [firstStep, secondStep], true);
		anEscalator.start();

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
