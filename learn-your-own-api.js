/*
	LEARN; YOUR OWN API; USING AWS API GATEWAY & LAMBDA.

	This is the same as other lambda with a wrapper to process data from API Gateway & respond to it.

	This is an example app to use as starting point for building a mydigitalstucture.cloud based nodejs app
	that you plan to host using AWS Lambda and trigger via API gateway.

	To run it on your local computer your need to install:

	https://www.npmjs.com/package/lambda-local:

	And then run as:

	lambda-local -l index.js -t 9000 -e learn-event.json -envfile learn-context.json

	- where the data in event.json will be passed to the handler as event and the settings.json data will passed as context.

	Also see learn.js for more example code using the mydigitalstructure node module.

	API Gateway docs:
	- https://docs.aws.amazon.com/lambda/latest/dg/nodejs-handler.html
	
*/

exports.handler = function (event, context, callback)
{
	var mydigitalstructure = require('mydigitalstructure')
	var _ = require('lodash')
	var moment = require('moment');

	/*
		[LEARN #1]
		Store the event data for use by controllers later.
	*/

	mydigitalstructure.set(
	{
		scope: 'learn',
		context: 'lambda',
		name: 'event',
		value: event
	});

	mydigitalstructure.set(
	{
		scope: 'learn',
		context: 'lambda',
		name: 'context',
		value: context
	});

	/*
		[LEARN #2]
		Use promise to responded to API Gateway once all the processing has been completed.
	*/

	const promise = new Promise(function(resolve, reject)
	{	
		mydigitalstructure.init(main)

		function main(err, data)
		{
			/*
				[LEARN #3]
				Use mydigitalstructure.add to add your controller methods to your app and mydigitalstructure.invoke to run them,
				as per example learn-log.

				This examples saves the event data that comes in from the API Gateway into the myds log.

				app starts with app.invoke('learn-init') after controllers added.
			*/

			mydigitalstructure.add(
			{
				name: 'learn-init',
				code: function ()
				{
					mydigitalstructure._util.message('Using mydigitalstructure module version ' + mydigitalstructure.VERSION);
					mydigitalstructure._util.message(mydigitalstructure.data.session);

					var eventData = mydigitalstructure.get(
					{
						scope: 'learn',
						context: 'lambda',
						name: 'event'
					});

					var request =
					{ 
						body: {},
						queryString: {},
						headers: {}
					}

					if (eventData != undefined)
					{
						request =
						{ 
							queryString: eventData.queryStringParameters,
							headers: eventData.headers
						}

						if (_.isString(eventData.body))
						{
							request.body = JSON.parse(eventData.body)
						}
						else
						{
							request.body = eventData.body;
						}	
					}

					mydigitalstructure.set(
					{
						scope: 'learn',
						context: 'lambda',
						name: 'request',
						value: request
					});

					mydigitalstructure.invoke('learn-user');
				}
			});

			mydigitalstructure.add(
			{
				name: 'learn-user',
				code: function (param)
				{
					mydigitalstructure.cloud.invoke(
					{
						method: 'core_get_user_details',
						callback: 'learn-user-process'
					});
				}
			});

			mydigitalstructure.add(
			{
				name: 'learn-user-process',
				code: function (param, response)
				{
					console.log(response)

					mydigitalstructure.set(
					{
						scope: 'learn',
						context: 'lambda',
						name: 'user',
						value: response
					});

					mydigitalstructure.invoke('learn-auth')
				}
			});

			mydigitalstructure.add(
			{
				name: 'learn-auth',
				code: function (param)
				{
					// You can take user credentials from the body/header and pass to mydigitalstructure.cloud.logon()
					// OR if using as proxy then use the credentials in settings.json - recommended (function/data) restricted user role.
					// In this example, checking that the GUID "api-key" passed in matches the api-key in the body (ssl).

					var request = mydigitalstructure.get(
					{
						scope: 'learn',
						context: 'lambda',
						name: 'request'
					});

					var requestGUID = request.body.apikey;

					var user = mydigitalstructure.get(
					{
						scope: 'learn',
						context: 'lambda',
						name: 'user'
					});

					mydigitalstructure.cloud.invoke(
					{
						object: 'core_debug_log',
						fields:
						{
							data: JSON.stringify(request.body.apikey),
							notes: 'Learn Lambda Log (request.body.apikey)'
						}
					});

					if (requestGUID != user.guid)
					{
						mydigitalstructure.set(
						{
							scope: 'learn',
							context: 'lambda',
							name: 'response',
							value:
							{
								status: 'ER',
								data: {error: {code: '1', description: 'Not a valid apikey [' + requestGUID + ']'}}
							}
						});

						mydigitalstructure.invoke('learn-respond')
					}
					else
					{
						mydigitalstructure.set(
						{
							scope: 'learn',
							context: 'lambda',
							name: 'response',
							value:
							{
								status: 'OK',
								data: {message: 'Valid apikey'}
							}
						});

						mydigitalstructure.invoke('learn-process')
						
						//mydigitalstructure.invoke('learn-log')
					}
				}
			});

			mydigitalstructure.add(
			{
				name: 'learn-log',
				code: function ()
				{
					var eventData = mydigitalstructure.get(
					{
						scope: 'learn',
						context: 'lambda',
						name: 'event'
					});

					mydigitalstructure.cloud.invoke(
					{
						object: 'core_debug_log',
						fields:
						{
							data: JSON.stringify(eventData),
							notes: 'Learn Lambda Log (Event)'
						}
					});

					var requestData = mydigitalstructure.get(
					{
						scope: 'learn',
						context: 'lambda',
						name: 'request'
					});

					mydigitalstructure.cloud.invoke(
					{
						object: 'core_debug_log',
						fields:
						{
							data: JSON.stringify(requestData),
							notes: 'Learn Lambda Log (Request)'
						}
					});

					var contextData = mydigitalstructure.get(
					{
						scope: 'learn',
						context: 'lambda',
						name: 'context'
					});

					mydigitalstructure.cloud.invoke(
					{
						object: 'core_debug_log',
						fields:
						{
							data: JSON.stringify(contextData),
							notes: 'Learn Lambda Log (Context)'
						},
						callback: 'learn-log-saved'
					});
				}
			});

			mydigitalstructure.add(
			{
				name: 'learn-log-saved',
				code: function (param, response)
				{
					mydigitalstructure._util.message('learn-log event data saved to mydigitalstructure.cloud');
					mydigitalstructure._util.message(param);
					mydigitalstructure._util.message(response);
				
					mydigitalstructure.invoke('learn-respond', {id: response.id})
				}
			});

			mydigitalstructure.add(
			{
				name: 'learn-respond',
				code: function (param)
				{
					var response = mydigitalstructure.get(
					{
						scope: 'learn',
						context: 'lambda',
						name: 'response'
					});

					var statusCode = response.httpStatus;
					if (statusCode == undefined) {statusCode = '200'}

					var body = response.data;
					if (body == undefined) {body = {}}

					var headers = response.headers;
					if (headers == undefined) {headers = {}}

					let httpResponse =
					{
						statusCode: statusCode,
						headers: headers,
						body: JSON.stringify(body)
					};

					resolve(httpResponse)
				}
			});

			//app specfic code

			mydigitalstructure.add(
			{
				name: 'learn-process',
				code: function ()
				{
					var request = mydigitalstructure.get(
					{
						scope: 'learn',
						context: 'lambda',
						name: 'request'
					});

					var data = request.body;

					//do the processing with the data in the body as per your api format;
				}
			});

			
			mydigitalstructure.invoke('learn-init');
		}     
   });

  	return promise
}