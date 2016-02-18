(function ($) {

    var log = function (message) {
        console.log(message);
    };

    /**
     * Opening a posts
     * @param cb
     */
    var getPosts = function (cb) {
        var countPosts = 0;

        log('-----------------------');

        chrome.storage.sync.get('count_post', function (obj) {
            var limitPost = parseInt(obj.count_post);

            log('Get posts...');

            var scrollerPage = function () {
                if ($('.userContentWrapper').length < limitPost && $('.userContentWrapper').length > countPosts) {

                    countPosts = $('.userContentWrapper').length;

                    $(window).scrollTop($('html').height());

                    setTimeout(function () {
                        scrollerPage();
                    }, 5000);
                } else {
                    cb();
                }
            };

            scrollerPage();
        });
    };

    var countPosts = function () {
        return $('.userContentWrapper').length;
    };

    var getComments = function (cb) {

        var postOffsetIndex = 0;
        var allUsers = [];

        var parseUsersFromComments = function (postIndex, cb) {
            var post = $('.userContentWrapper').eq(postIndex);

            var users = [];

            post.find('.UFIComment').each(function (index) {
                var $comment = $(this);

                var userData = {
                    photo: $comment.find('.UFIActorImage').attr('src'),
                    profileUrl: $comment.find('.UFICommentActorName').attr('href'),
                    name: $comment.find('.UFICommentActorName').text(),
                    id: $comment.find('.UFIImageBlockImage').attr('data-hovercard').match(/id=([0-9]*)/)[1]
                };

                users.push(userData);
            });

            cb(users);
        };

        /**
         * Opening comments
         * @param postIndex
         * @param cb
         */
        var extendComments = function (postIndex, cb) {
            var post = $('.userContentWrapper').eq(postIndex);

            if (post.find('.UFIPagerLink').length) {
                log('Click next comment');
                post.find('a.UFIPagerLink span').click();

                setTimeout(function () {
                    extendComments(postIndex, cb);
                }, 3000);
            } else {
                cb();
            }
        };

        /**
         * Read a posts
         * @param cb
         */
        var postReader = function (cb) {

            // Check limit posts
            chrome.storage.sync.get('count_post', function (obj) {
                if (postOffsetIndex < parseInt(obj.count_post)) {

                    var currentPostIndex = postOffsetIndex;
                    var post = $('.userContentWrapper').eq(postOffsetIndex);

                    log('Post index:' + currentPostIndex);

                    if (post.length) {
                        postOffsetIndex++;

                        if (post.find('.UFIComment').length) {
                            post.scrollTo(0);

                            log('Get comments...');

                            extendComments(currentPostIndex, function () {
                                log('Start parse users from comments...');

                                parseUsersFromComments(currentPostIndex, function (users) {
                                    log('Collect users and next post');

                                    allUsers = allUsers.concat(users);

                                    // Next post
                                    postReader(cb);
                                });
                            });
                        } else {
                            log('Post index: '+ currentPostIndex +' comments not found, next reading a post');
                            postReader(cb);
                        }

                    } else {
                        log('Post is end, index: '+ currentPostIndex +'. Run callback');
                        cb(allUsers);
                    }
                } else {
                    log('Post is limit index: '+ currentPostIndex +'. Run callback');
                    cb(allUsers);
                }
            });

        };

        log('Posts reading...');

        // Run read a posts and get comments and parse users
        postReader(cb);
    };

    getPosts(function () {
        getComments(function (users) {
            chrome.runtime.sendMessage({usersFromComments: users}, function(response) {
                console.log('Send message to popup');
            });
        });
    });

})(jQuery);