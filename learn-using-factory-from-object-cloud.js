/*
	This is an example app to use as starting point for building a mydigitalstucture.cloud based nodejs app ... 
	Once nodejs has been installed; run 'node learn.js' using the OS terminal/console command prompt

	If you plan to host the app using AWS lambda then check out index.js

	Help @ https://learn-next.mydigitalstructure.cloud/learn-function-automation
*/

var mydigitalstructure = require('mydigitalstructure')
var _ = require('lodash')
var moment = require('moment');
var learnfactory = require('learnfactory');

/*
	mydigitalstructure. functions impact local data.
	mydigitalstructure.cloud. functions impact data managed by the mydigitalstructure.cloud service (remote).

	All functions invoked on mydigitalstructure.cloud (remote) are asynchronous, 
	in that the local code will keep running after the invoke and you need to
	use a callcack: controller to handle the response from mydigitalstructure.cloud, as in examples 5 & 5 below.	

	To get the current logged on user using mydigitalstructure.cloud.invoke({method: 'core_get_user_details'}),

    node learn-using-factory-from-object-url.js
*/

mydigitalstructure.init(main)

function main(err, data)
{
    mydigitalstructure.add(
    {
        name: 'util-factory-load-from-url',
        code: function (param, response)
        {
            var url = mydigitalstructure._util.param.get(param, 'url').value;

            if (url == undefined)
            {
                console.log('No URL!')
            }
            else
            {
                const https = require('https');

                https.get(url, function(res)
                {
                    let data = [];
                    console.log('Status Code:', res.statusCode);
                    //console.log('Date in Response header:', headerDate);

                    res.on('data', function (chunk)
                    {
                        data.push(chunk);
                    });

                    res.on('end', function ()
                    {
                        console.log('Response ended: ');

                        var _learnfactory = JSON.parse(Buffer.concat(data).toString());
                        try
						{
                            learnfactory = JSON.parse(_learnfactory);

                            if (!_.isArray(learnfactory))
                            {
                                learnfactoryControllers = [learnfactory]
                            }
                            else
                            {
                                learnfactoryControllers = learnfactory
                            }

                            var controllers = [];

                            _.each(learnfactoryControllers, function(learnfactoryController)
                            {
                                if (_.startsWith(learnfactoryController.code, 'function'))
                                {
                                    learnfactoryController._code = _.split(learnfactoryController.code, ')');
                                    learnfactoryController._arguments = _.split(_.first(learnfactoryController._code), '(');
                                    learnfactoryController._arguments = _.last(learnfactoryController._arguments);

                                    learnfactoryController._code.shift();
                                    learnfactoryController._codeBody = _.join(learnfactoryController._code, ')');
                                }
                                else
                                {
                                    learnfactoryController._codeBody = learnfactoryController.code;
                                    learnfactoryController._arguments = learnfactoryController.arguments;
                                }
                            
                                controllers.push( 
                                {
                                    name: learnfactoryController.name,
                                    code: new Function(learnfactoryController._arguments, learnfactoryController._codeBody)
                                });
                            });

                            mydigitalstructure.add(controllers);

                        }
                        catch (error)
                        {
                            console.log('Error in JSON [' + url + ']');
                        }

                        mydigitalstructure._util.onComplete(param);
                    });
                })
                .on('error', function (err)
                {
                    console.log('ERROR! No learnfactory.json file.')
                    console.log('Error: ', err.message);
                });
            }
        }
    });

    mydigitalstructure.add(
    {
        name: 'learn-using-factory-from-object-file',
        code: function (param)
        {
            mydigitalstructure.invoke('util-factory-load-from-url',
            {
                onComplete: 'learn-using-factory-from-object-file-complete',
                url: 'https://learn.mydigitalstructure.cloud/site/1788/learnfactory.json'
            });
        }
    });

    mydigitalstructure.add(
    {
        name: 'learn-using-factory-from-object-file-complete',
        code: function (param)
        {
            mydigitalstructure.invoke('learn-using-factory-from-object-file-hello-world-1', 'HELLO', 'WORLD!');
            mydigitalstructure.invoke('learn-using-factory-from-object-file-hello-world-2', 'HELLO', 'WORLD AGAIN!');
        }
    });

    mydigitalstructure.invoke('learn-using-factory-from-object-file');
}