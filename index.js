/*** SoftliqHTTP Z-Way HA module *******************************************

Version: 0.0.1
(c) Jens Poxleitner, 2016
-----------------------------------------------------------------------------
Author: Jens Poxleitner <jpoxleitner@gmail.com>
Description:
    Module based on HTTP Device Module from Poltorak Serguei/Z-Wave.me
******************************************************************************/

// ----------------------------------------------------------------------------
// --- Class definition, inheritance and setup
// ----------------------------------------------------------------------------

function SoftliqHTTP (id, controller) {
    // Call superconstructor first (AutomationModule)
    SoftliqHTTP.super_.call(this, id, controller);
}

inherits(SoftliqHTTP, AutomationModule);

_module = SoftliqHTTP;

// ----------------------------------------------------------------------------
// --- Module instance initialized
// ----------------------------------------------------------------------------

SoftliqHTTP.prototype.init = function (config) {
    SoftliqHTTP.super_.prototype.init.call(this, config);

    var self = this,
        icon = "multilevel",
        deviceType = "sensorMultilevel";
    
    var config_metrics = { scaleTitle: "l" };

    var vDev = self.controller.devices.create({
        deviceId: "SoftliqHTTP_" + deviceType + "_" + this.id,
        defaults: {
            metrics: {
                icon: icon,
                title: 'SoftliqHTTP ' + this.id
            }
        },
        overlay: {
            deviceType: deviceType,
            metrics: config_metrics
        },
        handler: function (command, args) {
            var vDevType = deviceType;
            if (command === "update") {
                self.update(this);
            }
        },
        moduleId: this.id
    });
    
    if (vDev && this.config["getter_" + deviceType] && this.config["getterPollInterval_" + deviceType]) {
        this.timer = setInterval(function() {
            self.update(vDev);
        }, this.config["getterPollInterval_" + deviceType] * 1000);
    }
};

SoftliqHTTP.prototype.stop = function () {
    if (this.timer) {
        clearInterval(this.timer);
    }
    
    this.controller.devices.remove("SoftliqHTTP_" + this.config.deviceType + "_" + this.id);
    
    SoftliqHTTP.super_.prototype.stop.call(this);
};

// ----------------------------------------------------------------------------
// --- Module methods
// ----------------------------------------------------------------------------

SoftliqHTTP.prototype.update = function (vDev) {
    var self = this,
        deviceType = vDev.get("deviceType"),
        url = this.config["getter_" + deviceType];
    if (url) {
        var req = {
            url: "http://"+url+"/mux_http",
            method: "POST",
            async: true,
            headers: {
               "Content-Type": "application/x-www-form-urlencoded",
               "Authorization": "YWRtaW46UEFTU1dPUkQ="
            },
            data: {
               "id":"2042",
               "show":"D_Y_2_1~",
            },
            success: function(response) {
                var data = null;
                    if (typeof(response.data) === "string") {
                        var _data = response.data.trim();
                        console.log("SoftliqHTTP: "+_data);
                        var xmlDoc = new ZXmlDocument(_data);
                        _data = xmlDoc.findOne("/data/D_Y_2_1/text()");
                        console.log("SoftliqHTTP parsed: "+_data);
                        if (parseFloat(_data) != NaN) {
                            data = parseFloat(_data);
                        }
                    }
                if (data !== null && (self.config.skipEventIfSameValue !== true || data !== vDev.get("metrics:level"))) {
                    vDev.set("metrics:level", data);
                }
            },
            error: function(response) {
                console.log("Can not make request: " + response.statusText); // don't add it to notifications, since it will fill all the notifcations on error
            } 
        };
        http.request(req);
    }
};
