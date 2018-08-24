function loadAllAcripts(url) {
    let script = document.createElement("script"); // Make a script DOM node
    script.src = url; // Set it's src to the provided URL

    document.head.appendChild(script);
}

let host = "http://127.0.0.1:3000";
loadAllAcripts(host+'/js/faye.js');
loadAllAcripts(host+'/js/socket.io.js');
loadAllAcripts(host+'/js/easyrtc.js');

loadAllAcripts(host+'/js/low_bw.js');
loadAllAcripts(host+'/js/rates.js');
