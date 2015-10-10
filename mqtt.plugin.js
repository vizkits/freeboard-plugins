// A freeboard plugin that uses MQTT.js client to connect to MQTT broker 

(function()
{
    // ## A Datasource Plugin
    //
    // -------------------
    // ### Datasource Definition
    //
    // -------------------
    // **freeboard.loadDatasourcePlugin(definition)** tells freeboard that we are giving it a datasource plugin. It expects an object with the following:
    freeboard.loadDatasourcePlugin({
        "type_name"   : "mqtt",
        "display_name": "MQTT",
        "description" : "",
        "external_scripts" : [
            "plugins/thirdparty/mqtt.min.js"
        ],
        "settings"    : [
            {
                "name"         : "server",
                "display_name" : "MQTT Broker",
                "type"         : "text",
                "description"  : "Hostname",
                "required" : true
            },
            {
                "name"        : "port",
                "display_name": "Port",
                "type"        : "number", 
                "description" : "Port number",
                "required"    : true
            },
            {
                "name"        : "topic",
                "display_name": "Topic",
                "type"        : "text",
                "description" : "Topic to subscribe",
                "required"    : true
            },
            {
                "name"        : "use_ssl",
                "display_name": "Use SSL",
                "type"        : "boolean",
                "description" : "",
                "default_value": false
            },
            {
                "name"        : "client_id",
                "display_name": "Client ID",
                "type"        : "text",
                "default_value": "",
                "required"    : false
            },
            {
                "name"        : "username",
                "display_name": "Username",
                "type"        : "text",
                "default_value": "",
                "required"    : false
            },
            {
                "name"        : "password",
                "display_name": "Password",
                "type"        : "text",
                "default_value": "",
                "required"    : false
            },
            {
                "name"        : "json_data",
                "display_name": "JSON messages",
                "type"        : "boolean",
                "description" : "",
                "default_value": true
            }
        ],
        // **newInstance(settings, newInstanceCallback, updateCallback)** (required) : A function that will be called when a new instance of this plugin is requested.
        // * **settings** : A javascript object with the initial settings set by the user. The names of the properties in the object will correspond to the setting names defined above.
        // * **newInstanceCallback** : A callback function that you'll call when the new instance of the plugin is ready. This function expects a single argument, which is the new instance of your plugin object.
        // * **updateCallback** : A callback function that you'll call if and when your datasource has an update for freeboard to recalculate. This function expects a single parameter which is a javascript object with the new, updated data. You should hold on to this reference and call it when needed.
        newInstance   : function(settings, newInstanceCallback, updateCallback)
        {
            newInstanceCallback(new mqttDatasourcePlugin(settings, updateCallback));
        }
    });


    // ### Datasource Implementation
    //
    // -------------------
    // Here we implement the actual datasource plugin. We pass in the settings and updateCallback.
    var mqttDatasourcePlugin = function(settings, updateCallback)
    {
        var self = this;

        var currentSettings = settings;

        // **onSettingsChanged(newSettings)** (required) : A public function we must implement that will be called when a user makes a change to the settings.
        self.onSettingsChanged = function(newSettings)
        {
            client.end();
            currentSettings = newSettings;
            client = mqtt.connect({ host: currentSettings.server, 
                                    port: currentSettings.port,
                                    clientId: currentSettings.client_id,
                                    username: currentSettings.username,
                                    password: currentSettings.password });
        }

        // **updateNow()** (required) : A public function we must implement that will be called when the user wants to manually refresh the datasource
        self.updateNow = function()
        {
            // Don't need to do anything here, can't pull an update from MQTT.
        }

        // **onDispose()** (required) : A public function we must implement that will be called when this instance of this plugin is no longer needed. Do anything you need to cleanup after yourself here.
        self.onDispose = function()
        {
            if (!client.disconnecting) {
                client.end();
            }
            client = null;
        }

        // TODO: support ssl option
        var client = mqtt.connect({ host: currentSettings.server, 
                                    port: currentSettings.port,
                                    clientId: currentSettings.client_id,
                                    username: currentSettings.username,
                                    password: currentSettings.password });

        client.subscribe(currentSettings.topic);

        client.on('message', function(topic, message) {
            var data = { topic: topic };
            if (currentSettings.json_data) {
                data.msg = JSON.parse(message);
            } else {
                data.msg = message;
            }
            updateCallback(data);
        });
    }
}());