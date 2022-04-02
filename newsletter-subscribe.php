<?php
/*
 * Hosting Company Landing page v1.0 - simple newsletter subscription script
 * (c) Web factory Ltd
**/

/* Set the filename where you want to save the email addresses of your subscribers.
 * The script can't function if you don't set this variable properly! Refer to our detailed manual for instructions.
**/
  $emailsFile = 'subscribed-emails.txt';

/* if you want to receive an email every time someone subscribes to your newsletter,
 * enter your email into this variable. Othervise leave it blank.
**/
  $myEmail = '';

/**** DO NOT EDIT BELOW THIS LINE ****/
/**** DO NOT EDIT BELOW THIS LINE ****/
  ob_start();

  function response($responseStatus, $responseMsg) {
    $out = json_encode(array('responseStatus' => $responseStatus, 'responseMsg' => $responseMsg));

    ob_end_clean();
    die($out);
  }

  // only AJAX calls allowed
  if (!isset($_SERVER['X-Requested-With']) && !isset($_SERVER['HTTP_X_REQUESTED_WITH'])) {
    response('err', 'ajax');
  }

  // can't read/write to emails file?
  if (($file = fopen($emailsFile, 'r+')) == false) {
    response('err', 'fileopen');
  }

  // invalid email address?
  if(!isset($_POST['email-address']) || !preg_match('/^[^@]+@[a-zA-Z0-9._-]+\.[a-zA-Z]+$/', trim($_POST['email-address']))) {
    response('err', 'email');
  }

  // duplicate email address?
  $emailAddress = trim(strtolower($_POST['email-address']));
  while($line = fgets($file)) {
    if (trim($line) == $emailAddress) {
      response('err', 'duplicate');
    }
  } // while

  // write email to file
  fseek($file, 0, SEEK_END);
  if (fwrite($file, $emailAddress . PHP_EOL) == strlen($emailAddress . PHP_EOL)) {
    // send email to site owner with new subscrciber info
    if (preg_match('/^[^@]+@[a-zA-Z0-9._-]+\.[a-zA-Z]+$/', trim($myEmail))) {
        $headers  = "MIME-Version: 1.0 \n";
        $headers .= "Content-type: text/plain; charset=UTF-8 \n";
        $headers .= "X-Mailer: PHP " . PHP_VERSION . "\n";
        $headers .= "From: {$myEmail} \n";
        $headers .= "Return-Path: {$myEmail} \n";
        $message = 'The following person was kind enough to subscribe to your newsletter - ' . $_POST['email-address'];
        @mail($myEmail, 'You have a new newsletter subscriber', $message, $headers);
    }
    response('ok', 'subscribed');
  } else {
    response('err', 'filewrite');
  }

  response('err', 'undefined');
?>