/*
	This is an example app to use as starting point for building a mydigitalstucture.cloud based nodejs app ... 
	Once nodejs has been installed; run 'node learn.js' using the OS terminal/console command prompt

	If you plan to host the app using AWS lambda then check out index.js

	Help @ https://learn-next.mydigitalstructure.cloud/learn-function-automation

    Uses:

    SETUP_AUTOMATION_CONTROLLER_
        - automation: id of automation relates to
        - name: controller name
        - notes: text (8000)
        - version: text (50)
        - parameters: text(500)
        - code: text (large)
        - status: [1: Enabled, 2: Disabled]

    Run:
    node learn-using-factory-from-object-cloud.js

    Setup example automation in space:
    
    - Create automation:

    mydigitalstructure.cloud.save(
    {
        object: 'setup_automation',
        data: 
        {
            title: 'Learn Automation Example',
            type: 4

        }
    });

    - Create automation controller:

    mydigitalstructure.cloud.save(
    {
        object: 'setup_automation_controller',
        data:
        {
            automation: 1234,
            name: 'learn-automation-example-hello-world',
            parameters: 'param',
            code: '{console.log("CREATED FROM FACTORY OBJECT 2; " + param + " " + data)}'
        }
    });
*/

var mydigitalstructure = require('mydigitalstructure')
var _ = require('lodash')
var moment = require('moment');
var learnfactory = require('learnfactory');

mydigitalstructure.init(main)

function main(err, data)
{
    mydigitalstructure.add(
    {
        name: 'util-factory-load-from-cloud',
        code: function (param, response)
        {
            var automationID = mydigitalstructure._util.param.get(param, 'automation').value;
            var automationTitle = mydigitalstructure._util.param.get(param, 'automationTitle').value;
            var controllerVersion = mydigitalstructure._util.param.get(param, 'controllerVersion').value;
            var controllerName = mydigitalstructure._util.param.get(param, 'controllerName').value;
           
            if (automationID == undefined && automationTitle == undefined)
            {
                console.log('No Automation Details!')
            }
            if (controllerName == undefined)
            {
                console.log('No Controller Name (ie to run) set, so what is the point!')
            }
            else
            {
                if (response == undefined)
                {
                    var filters = [];

                    if (automationID != undefined)
                    {
                        filters.push(
                        {
                            field: 'automation',
                            value: automationID
                        });
                    }

                    if (automationTitle != undefined)
                    {
                        filters.push(
                        {
                            field: 'automationtext',
                            value: automationTitle
                        });
                    }

                    if (controllerVersion != undefined)
                    {
                        filters.push(
                        {
                            field: 'version',
                            value: controllerVersion
                        });
                    }

                    mydigitalstructure.cloud.search(
                    {
                        object: 'setup_automation_controller',
                        fields:
                        [
                            {name: 'automation'},
                            {name: 'name'},
                            {name: 'notes'},
                            {name: 'version'},
                            {name: 'status'},
                            {name: 'userrole'},
                            {name: 'code'}
                        ],
                        filters: filters,
                        all: true,
                        callback: 'util-factory-load-from-cloud',
                        callbackParam: param
                    });
                }
                else
                {
                    if (response.data.rows.length == 0)
                    {
                        console.log('No controllers!')
                    }
                    else
                    {
                        learnfactoryControllers = response.data.rows;
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

                        mydigitalstructure.invoke(controllerName, 'Hello', 'World');
                    }
                }
            }
        }
    });

    mydigitalstructure.add(
    {
        name: 'learn-using-factory-from-object-cloud',
        code: function (param)
        {
            mydigitalstructure.invoke('util-factory-load-from-cloud',
            {
                automationTitle: 'Learn Automation Example',
                controllerName: 'learn-automation-example-hello-world'
            });
        }
    });

    mydigitalstructure.invoke('learn-using-factory-from-object-cloud');
}