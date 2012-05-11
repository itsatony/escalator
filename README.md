escalator
=========

a flow-control class for javascript (nodeJS & browser)

##	DESCRIPTION 
 
in async environments - we do love them - there are times when you need to make sure foo is run after bar in all cases.
for our VisualWeb framework we thus developed a object/class called escalator that allows us to write sequential code.
 
  *  this code is part of the VisualWeb Project by 
 	*  LinkCloud ( http://www.mylinkcloud.com )
 	*  ViSERiON UG (haftungsbeschraenkt) ( http://www.viserion.com )  
  *  K!Lab GmbH ( http://www.klab-berlin.com )
  *  MIT license. 
 
 
  * AUTHOR: 
 		 Toni Wagner @itsatony
  		
## DEPENDENCIES
 * dependencies were removed ... this is totally independent now .
 * it should integrate into NodeJS on the server-side or any browser-side with javascript enabled.

## TESTS
 *	none yet ;(
 
## VERSIONS
 * v0.1.0	initial public release		08.05.2012			
   * removed dependencies 
   * enabled using the same file for client- and nodeJS server-side implementation
 
## URLs
 * blogpost: <http://coffeelog.itsatony.com/escalator>
 * github: <https://github.com/itsatony/escalator>
 
## CODE EXAMPLES
 * 1 - three steps, different configs  

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

