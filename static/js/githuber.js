require(['angular','angularRoute','echarts','oauth', 'jquery', 'bootstrap'], function(angular){
	alert(angular);
	var myApp = angular.module('githuber', ['ngRoute']);
	myApp.config(['$routeProvider',function($routeProvider) {
		$routeProvider.
		when('index', {controller: indexContrl, templateUrl: 'static/tpl/index.html'}).
		when('search/:serchTarget', {controller: GithuberCtl, templateUrl: 'static/tpl/search.html'}).otherwise({
	       redirectTo: '/index'
	    });
	}]);
	myApp.controller('GithuberCtl',['$scope',function($scope) {
		$scope.targetUser = "numbbbbb";
	    $scope.languageBytesInOwnedRepos = {} // 自己repo的语言字节数统计 注意这里是字节数不是行数 GitHub不提供行数
	    $scope.languageOfStarredRepos = {} // star repo的语言统计 只统计个数 比如Python的repo 100个
	    $scope.ownedRepoStars = {} // TODO：自己的repo被star的次数以及repo的信息，比如title description以及readme 之后鼠标移动到repo上会显示这些信息
		$scope.githuber = {
			login: "id",
			avatar_url : "https://avatars.githubusercontent.com/u/2572987?v=3",
			name: "test",
			company: "buaa",
			email: "xxxx@xxx.com",
			page: "numbbbbb.com",
			followers: 5020,
			public_repos: 20,
			codings: 50000
		};
		OAuth.initialize("MS6wvoyoJiptc7dsDm_sYY8l3vI");
	    var Barrier = function() { // 用于等待多个ajax完成
	        this.barrierNumber = 0
	        this.checkFinish = function(cb) {
	            that = this;
	            var clock = function() {
	                if (that.barrierNumber === 1) {
	                    cb()
	                } else {
	                    setTimeout(clock, 200)
	                }
	            }
	            setTimeout(clock, 200)
	        }
	    }
		$scope.searchUser = function() {
			OAuth.popup('github').done( function(github) {
				getUserInfo($scope.targetUser, github);
				getCodeLines($scope.targetUser, github);
				getStarredInfo($scope.targetUser, github);
			}).fail(function(err) {
				alert("连接API失败" + err);
			});
		};

		var getUserInfo = function(targetUser, github) {
			var info = ['login', 'avatar_url', 'name', 'company', 'email', 'followers', 'public_repos'];
			if ($scope.targetUser != "") {
				var url = "https://api.github.com/users/" + targetUser;
			    // OAuth.popup('github').done(function(github) {
			        $.ajax({
			         url: url,
			         dataType: "json"
			        }).always(function(data) {
			        	for (var i = 0, l = info.length; i < l; i++) {
			        		$scope.githuber[info[i]] = data[info[i]];
			        	}
			        	$scope.$digest();
			         	console.log($scope.githuber);
			        });
			    // }).fail(function(err) {
			    // 	alert("false");
			    // });
			}
		};
		var getCodeLines = function(targetUser, github) {
		    // OAuth.popup('github').done(function(github) {
		        github.get({
		            url: "https://api.github.com/users/" + targetUser + "/repos?page=1&per_page=10000",
		            dataType: "json"
		        }).done(function(data) {
		            var barrier = new Barrier()
		            barrier.barrierNumber = data.length
		            $.map(data, function(repo, i) {
		                github.get({
		                    url: "https://api.github.com/repos/" + targetUser + "/" + repo.name + "/languages",
		                    dataType: "json"
		                }).done(function(data) {
		                    barrier.barrierNumber--
		                        if ("status" in data || $.isEmptyObject(data)) {
		                            return
		                        }
		                    $.each(data, function(language, lines) {
		                        if (isNaN(lines)) {
		                            return
		                        }
		                        if (!(language in $scope.languageBytesInOwnedRepos)) {
		                            $scope.languageBytesInOwnedRepos[language] = 0
		                        }
		                        $scope.languageBytesInOwnedRepos[language] += lines
		                    })
		                })
		            })
		            barrier.checkFinish(function() {
		                console.log($scope.languageBytesInOwnedRepos);
		                var lanData = [];
		                var lanTag = [];
		                for (var i in $scope.languageBytesInOwnedRepos) {
		                	if ($scope.languageBytesInOwnedRepos.hasOwnProperty(i)) {
		                		lanTag.push(i);
		                		lanData.push($scope.languageBytesInOwnedRepos[i]);
		                	}
		                }
						var option = {
							title : {
							    text: '代码量统计'
							},
						    tooltip : {
						        trigger: 'axis',
						        axisPointer : {            // 坐标轴指示器，坐标轴触发有效
						            type : 'shadow'        // 默认为直线，可选为：'line' | 'shadow'
						        }
						    },
						    toolbox: {
						        show : true
						    },
						    calculable : true,
						    xAxis : [
						        {
						            type : 'value'
						        }
						    ],
						    yAxis : [
						        {
						            type : 'category',
						            data : lanTag
						        }
						    ],
						    series : [
						        {
						            name:'字节数',
						            type:'bar',
						            stack: '总量',
						            itemStyle : { normal: {label : {show: true, position: 'right'}}},
						            data: lanData
						        }
						    ]
						};
						echarts.init($('#codeChart')[0]).setOption(option);
		            });
		        });
		};
        // 获取star的repo并统计语言
        var getStarredInfo = function(targetUser, github) {
        	var getStarredInfoAt = function(pageNumber) {
	 			github.get({
	                url: "https://api.github.com/users/" + targetUser + "/starred?page=" + pageNumber + "&per_page=100",
	                dataType: "json"
	            }).done(function(data) {
	                $.map(data, function(repo, i) {
	                    if (repo.language) {
	                        if (!(repo.language in $scope.languageOfStarredRepos)) {
	                            $scope.languageOfStarredRepos[repo.language] = 0
	                        }
	                        $scope.languageOfStarredRepos[repo.language] += 1
	                    }
	                })
	                if (data.length === 100) {
	                    getStarredInfoAt(pageNumber + 1)
	                } else {
	                    console.log($scope.languageOfStarredRepos);
	                    painStarChart($scope.languageOfStarredRepos);
	                }
	            })
        	};
        	var painStarChart = function(languageOfStarredRepos) {
	            var starData = [];
	            for (var i in languageOfStarredRepos) {
	            	if (languageOfStarredRepos.hasOwnProperty(i)) {
	            		starData.push({
	            			value: languageOfStarredRepos[i],
	            			name: i
	            		});
	            	}
	            }
				var option = {
				    title : {
				        text: 'Star项目分布',
				        x:'center'
				    },
				    tooltip : {
				        trigger: 'item',
				        formatter: "{a} <br/>{b} : {c} ({d}%)"
				    },
				    toolbox: {
				        show : true,
				        feature : {
				            magicType : {
				                show: true,
				                type: ['pie', 'funnel']
				            },
				            restore : {show: true}
				        }
				    },
				    calculable : true,
				    series : [
				        {
				            name:'Star项目分布',
				            type:'pie',
				            radius : [30, 110],
				            center : ['50%', 200],
				            roseType : 'area',
				            x: '0%',               // for funnel
				            max: 40,                // for funnel
				            sort : 'ascending',     // for funnel
				            data : starData
				        }
				    ]
				};
				console.log(starData);
				echarts.init($('#starChart')[0]).setOption(option);
        	}
	        getStarredInfoAt(1);

        };

        var getContributionInfo = function(targetUser) {
	        // 获取fork的repo并统计自己在其中的贡献字节数
	        github.get({
	            url: "https://api.github.com/users/" + targetUser + "/repos?page=1&per_page=10000",
	            dataType: "json"
	        }).done(function(data) {
	            var barrier = new Barrier()
	            barrier.barrierNumber = data.length
	            $.map(data, function(repo, i) {
	                github.get({
	                    url: "https://api.github.com/repos/" + targetUser + "/" + repo.name,
	                    dataType: "json"
	                }).done(function(data) {
	                    if (!("parent" in data) || $.isEmptyObject(data)) {
	                        barrier.barrierNumber--
	                            return
	                    }
	                    var getContributionInfoAt = function(pageNumber) {
	                        github.get({
	                            url: "https://api.github.com/repos/" + data.parent.owner.login + "/" + data.name + "/stats/contributors?page=" + pageNumber + "&per_page=100",
	                            dataType: "json"
	                        }).done(function(data) {
	                            var findUser = false
	                            $.map(data, function(contribution, i) {
	                                if (contribution.author.login === targetUser) {
	                                    findUser = true
	                                    $.map(contribution.weeks, function(week, i) {
	                                        contributionBytes += week.a + week.d + week.c
	                                    })
	                                }
	                            })
	                            if (findUser) {
	                                barrier.barrierNumber--
	                            } else if (data.length === 100 && pageNumber < 10) {
	                                getContributionInfoAt(pageNumber + 1)
	                            } else {
	                                barrier.barrierNumber--
	                            }
	                        })
	                    };
	                    getContributionInfoAt(1)
	                });
	            });
	            barrier.checkFinish(function() {
	                console.log(contributionBytes)
	            });
	        });
        }


	}]);


})
