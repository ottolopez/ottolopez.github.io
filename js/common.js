$(function() { 
  // tipsy tooltips
  $('#social a').tipsy({gravity: 'n'});
  
  // hide/show default text when user focuses on newsletter subscribe field
  var defaultEmailTxt = $('#email-address').val();
  $('#email-address').focus(function() {
        if ($('#email-address').val() == defaultEmailTxt) {
            $('#email-address').val('');
        }
    });
  $('#email-address').blur(function() {
        if ($('#email-address').val() == '') {
            $('#email-address').val(defaultEmailTxt);
        }
  });
    
  // Twitter script config
  if ($('#tweet').length) {
    $('#tweet').tweet({ username: 'webfactoryltd',
                        retweets: true,
                        join_text: 'auto',
                        avatar_size: 0,
                        count: 1,
                        template: '{avatar} {time} {join} {text}',
                        auto_join_text_default: ' we said, ', 
                        auto_join_text_ed: ' we ',
                        auto_join_text_ing: ' we were ',
                        auto_join_text_reply: ' we replied to ',
                        auto_join_text_url: ' we were checking out ',
                        loading_text: 'loading tweets...'
                     });
  }
    
  // init newsletter subscription AJAX handling
  $('#newslettersubmit').click(function() { $('#newsletterform').submit(); return false; });
  if ($('#newsletterform').attr('action').indexOf('mailchimp') == -1) {
    $('#newsletterform').ajaxForm({dataType: 'json',
                                   timeout: 2000,
                                   success: newsletterResponse});
  } else {
    $('#newsletterform').ajaxForm({dataType: 'json',
                                   timeout: 4000,
                                   beforeSubmit: function() {  $('#newslettersubmit').data('org-html', $('#newslettersubmit').html()).html('Please wait')},
                                   success: newsletterResponseMailchimp});
  }
  
    
  // handle newsletter subscribe AJAX response
    function newsletterResponse(response) {
      if (response.responseStatus == 'err') {
        if (response.responseMsg == 'ajax') {
          alert('Error - this script can only be invoked via an AJAX call.');
        } else if (response.responseMsg == 'fileopen') {
          alert('Error opening $emailsFile. Please refer to documentation for help.');
        } else if (response.responseMsg == 'email') {
          alert('Please enter a valid email address.');
        } else if (response.responseMsg == 'duplicate') {
          alert('You are already subscribed to our newsletter.');
        } else if (response.responseMsg == 'filewrite') {
          alert('Error writing to $emailsFile. Please refer to documentation for help.');
        } else {
          alert('Undocumented error. Please refresh the page and try again.');
        }
      } else if (response.responseStatus == 'ok') {
        alert('Thank you for subscribing to our newsletter! We will not abuse your address.');
      } else {
        alert('Undocumented error. Please refresh the page and try again.');
      }
    } // newsletterResponse
    
    function newsletterResponseMailchimp(response) {
      if (response.responseStatus == 'err') {
        if (response.responseMsg == 'ajax') {
          alert('Error - this script can only be invoked via an AJAX call.');
        } else if (response.responseMsg == 'email') {
          alert('Please enter a valid email address.');
        } else if (response.responseMsg == 'duplicate') {
          alert('You are already subscribed to our newsletter.');
        } else if (response.responseMsg == 'listid') {
          alert('Invalid MailChimp list.');
        } else {
          alert('Undocumented error. Please refresh the page and try again. ' + response.responseMsg);
        }
      } else if (response.responseStatus == 'ok') {
        alert('Thank you for subscribing to our newsletter! We will not abuse your address.');
      } else {
        alert('Undocumented error. Please refresh the page and try again.');
      }
      
      $('#newslettersubmit').html($('#newslettersubmit').data('org-html'));
    } // newsletterResponseMailchimp
        
  // pricebox effects
  if($('.price-box').length) {
        $('.price-box').hover(function() {
          $('.price-box').removeClass('pretty-hover');
          $(this).addClass('pretty-hover');
        }, function() {} );

  }
  
  // slider
  if ($('#slides').length) {
    $('#slides').slides({
      preload: true,
      preloadImage: '../images/loading.gif',
      generatePagination: true,
      play: 10000,
      pause: 2500,
      hoverPause: true,
      start: 2
    });
  }
  
  // open external links in a new window
  $('a').click(function() {
        var href = $(this).attr('href');
        var hrgx = new RegExp('http');
        var hcls = $(this).hasClass('noblank');
        if (hrgx.test(href) == true && hcls == false){
            $(this).attr('target','_blank');
        }
        return true;
  });
  
  // tabs
  $('.tab_content').hide();
  $('ul.tabs li:first').addClass('active').show();
  $('.tab_content:first').show();
  $('ul.tabs li').click(function() {
    $('ul.tabs li').removeClass('active');
    $(this).addClass('active');
    $('.tab_content').hide();
    var activeTab = $(this).find('a').attr('href');
    $(activeTab).fadeIn();
    return false;
  });
}); // onload