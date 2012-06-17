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
  		
## USPs

  * escalator offers DELAYS between steps. These are handy to make your app more response during cpu/load intensive code sequences. For example timeouts are a good idea to update upload/downloaf/progress bars
  * escalator offers setting of code-SCOPE PER STEP, thus enabling you to control the memory environment your steps are run in.
  * escalator offers a CONSTANT NAMESPACE, actually its own namespace, which is made available (passed as an additional call parameter) to every step. Thus, exchange of data between steps is super-easy and straightforward.
  * escalator objects can PERSIST with fully running and debugging info if you want that.
  * escalator offers a debug/logging mode that will record the time each step takes. very handy for performance optimization and error tracing
  * escalator wraps each step-call into a try-catch and allows you to define the errorhandler.
  * escalator steps can control the flow of efficiently, even stop the complete escalator with a message.

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

```javascript
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
	
```
