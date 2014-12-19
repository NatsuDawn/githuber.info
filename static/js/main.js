require.config({
    paths : {
        "jquery" : ["static/js/jquery-2.1.1.min"],
        "oauth" : ["static/js/oauth.min"],
        "bootstrap" : ["static/js/bootstrap.min"],
        "angular" : ["static/js/angular.min"],
        "angularRoute" : ["static/js/angular-route"],
        "echarts" : ["static/js/echarts-all"]
    },
    shim: {
        'angular' : {'exports' : 'angular'},
        'angularRoute': ['angular']
    },
    priority: [
        "angular"
    ]
});
