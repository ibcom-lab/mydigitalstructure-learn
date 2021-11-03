/*
	LEARN; UPLOAD FILE TO MYDIGITALSTRUCTURE.CLOUD.

	This is the same as other lambda with a wrapper to process data from API Gateway & respond to it.

	This is an example app to use as starting point for building a mydigitalstucture.cloud based nodejs app
	that you plan to host using AWS Lambda and trigger via API gateway.

	To run it on your local computer your need to install:

	https://www.npmjs.com/package/lambda-local:

	And then run as:

	lambda-local -l learn-upload.js -t 9000 -e learn-event-upload.json

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
		Store the event data and callback for use by controllers later.
	*/

    mydigitalstructure.set(
    {
        scope: '_event',
        value: event
    });

	mydigitalstructure.set(
    {
        scope: '_callback',
        value: callback
    });

    mydigitalstructure.init(main)

    function main(err, data)
    {
        /*
            [LEARN #1]

            This example uploads a file to the contact record linked to your user account.

            i.e. in browser based UI can use the util-view-table controller or do direct search using:

            mydigitalstructure.cloud.search(
            {
                object: 'core_attachment',
                fields: ['filename', 'download'],
                filters:
                {
                    {
                        field: 'object'
                        value: '22'
                    },
                    {
                        field: 'objectcontext'
                        value: app.whoami().thisInstanceOfMe.user.id
                    },
                }
            });
        */

        mydigitalstructure.add(
        {
            name: 'learn-upload-init',
            code: function ()
            {
                mydigitalstructure._util.message('Using mydigitalstructure module version ' + mydigitalstructure.VERSION);
                mydigitalstructure._util.message(mydigitalstructure.data.session);

                mydigitalstructure.invoke('learn-upload-start');
            }
        });

        mydigitalstructure.add(
        {
            name: 'learn-upload-start',
            code: function ()
            {
                var event = mydigitalstructure.get({scope: '_event'});
                var session = mydigitalstructure.get({scope: '_session'});

                //[LEARN #2] Get the logged on user ID from the session data
                // Object 22 is setup_user object ID on mydigitalstructure.cloud

                var dataBase64 = Buffer.from('LEARN FILE DATA', 'binary').toString('base64');

                if (event.object == undefined)
                {
                    event.object = 22
                }

                if (event.objectContext == undefined && event.object == 22)
                {
                    event.objectContext = session.user
                }

                mydigitalstructure.upload(
                {
                    filename: event.filename,
                    object: event.object,
                    objectContext: event.objectContext,
                    base64: true,
                    onComplete: 'learn-upload-complete'
                },
                {base64: dataBase64})
            }
        });

        mydigitalstructure.add(
        {
            name: 'learn-upload-complete',
            code: function (param)
            {
                console.log(param)
            }
        });
    
        mydigitalstructure.add(
        {
            name: 'util-end',
            code: function (data, error)
            {
                var callback = mydigitalstructure.get(
                {
                    scope: '_callback'
                });

                if (error == undefined) {error = null}

                if (callback != undefined)
                {
                    callback(error, data);
                }
            }
        });

        mydigitalstructure.invoke('learn-upload-init');
    }     


}