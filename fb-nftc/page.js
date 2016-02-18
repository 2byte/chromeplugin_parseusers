
document.addEventListener('DOMContentLoaded', function () {
    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        if (request.hasOwnProperty('pageMessage')) {

            $('#users').empty().html(request.pageMessage);
            
            sendResponse('OK');
        }
    });
});