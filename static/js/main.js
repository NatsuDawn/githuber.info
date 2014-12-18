require.config({
    paths : {
        "jquery" : ["static/js/jquery-2.1.1.min"],
        "oauth" : ["static/js/oauth.min"],
        "bootstrap" : ["static/js/bootstrap.min"],
        "angular" : ["static/js/angular.min"],
        "angular-route" : ["static/js/angular-route.min"],
        "echarts" : ["static/js/echarts-all"]
    },
    shim: {
        "bootstrap" : ["jquery"]
    }
});
