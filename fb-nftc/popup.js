document.addEventListener('DOMContentLoaded', function () {

    $('#form-parser #start').click(function (e) {
        e.preventDefault();

        chrome.storage.sync.set({
            count_post: $('input[name=count_post]').val()
        });

        chrome.tabs.query({active: true, currentWindow: true}, function (tab) {
            chrome.tabs.executeScript(tab[0].id, {file: 'fb-parser.js'}, function () {

            });
        });

        //

        var getUsersByCount = function (users) {

            var usersList = [];

            var randomIntFromInterval = function (min, max) {
                return Math.floor(Math.random()*(max-min+1)+min);
            };

            var countUsers = function (userId) {
                return users.filter(function (item) {
                    return item.id == userId;
                }).length;
            };

            var checkUserlistExists = function (userId) {
                return usersList.filter(function (item) {
                    return item.id == userId;
                }).length;
            };

            users.forEach(function (item) {
                if (!checkUserlistExists(item.id)) {

                    item.countPost = countUsers(item.id);
                    // For test
                    //item.countPost = randomIntFromInterval(1, 100);

                    usersList.push(item);
                }
            });

            return usersList.sort(function (a, b) {
                return a.countPost - b.countPost;
            }).reverse();

        };

        chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
            if (request.hasOwnProperty('usersFromComments')) {
                sendResponse("OK");

                //chrome.storage.sync.set({usersObject: request.usersFromComments});

                // For test
                /*console.log('count items: ', request.usersFromComments.length);
                console.log(getUsersByCount(request.usersFromComments));*/

                var usersHtmlList = getUsersByCount(request.usersFromComments).map(function (item, index) {
                    return '<div class="user-item">' +
                        '<div class="avatar"><img src="'+ item.photo +'"></div>' +
                        '<div class="info"><b>'+ (index + 1) +'</b> <a href="'+ item.profileUrl +'" target="_blank">'+ item.name +'</a> ('+ item.countPost +')</div>' +
                        '</div><div style="clear: both;"></div>';
                }).join("");

                chrome.tabs.create({url: chrome.extension.getURL('page.html'), active: false}, function (tab) {
                    var selfTabId = tab.id;

                    chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
                        if (changeInfo.status == "complete" && tabId == selfTabId) {
                            chrome.runtime.sendMessage({pageMessage: usersHtmlList}, function(response) {
                                console.log('Send message to new tab');
                            });
                        }
                    });

                });

            } else {
                $('#note').text('Нет юзеров');
            }
        });

    });

    $('#form-parser #stop').click(function (e) {
        e.preventDefault();


    });
});