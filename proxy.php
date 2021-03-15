<?php
$url = $_REQUEST['url'] ?? null;
if($url != null) {
	$ch = curl_init();
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
	curl_setopt($ch, CURLOPT_URL, urldecode($url));
	$data = curl_exec($ch);
	if($data != null) {
		echo $data;
	} else {
		http_response_code(404);
	}
} else {
	http_response_code(400);
}