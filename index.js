var express = require('express');
var request = require("request");
var app = express();

let icecastStatusJsonUrl = process.env.ICECAST_URL;
if (!icecastStatusJsonUrl) {
    icecastStatusJsonUrl = "http://localhost:9146/status-json.xsl";
}
console.log(icecastStatusJsonUrl);


app.use(express.static('public'));
app.use(function (req, res, next) {
    res.setHeader("Content-Type", "text/plain");
    next();
});
app.get('/metrics', function (req, res) {
    request({
        url: icecastStatusJsonUrl,
        json: false
    }, function (error, response, body) {

        if (!error && response.statusCode === 200) {
            let data = {};
            try {
                body = body.replace(/"title": - ,/, '"title": "" ,')
                data = JSON.parse(body);
                if (data.icestats && data.icestats.source && !Array.isArray(data.icestats.source)) {
                    data.icestats.source = [data.icestats.source];
                }
            } catch (error) {
                console.log(error);
            }
            if (!data || !data.icestats) {
                const metrics =
                    `# HELP icecast_server_up Was the last scrape of Icecast successful.
# TYPE icecast_server_up gauge
icecast_server_up 0`

                res.send(metrics);
                return;
            }
            let metrics =
                `# HELP icecast_server_info Server information
# TYPE icecast_server_info gauge
icecast_server_info{admin="${data.icestats.admin}",host="${data.icestats.host}",location="${data.icestats.location}",server_id="${data.icestats.server_id}"} 1
# HELP icecast_server_up Was the last scrape of Icecast successful.
# TYPE icecast_server_up gauge
icecast_server_up 1`;

            if (data.icestats.source) {
                data.icestats.source.forEach(sourceItem => {
                    const streamPrefix = `icecast_server_stream_${data.icestats.source.indexOf(sourceItem)}`;
                    metrics +=
                        `\n# TYPE ${streamPrefix}_listeners gauge
${streamPrefix}_listeners ${sourceItem.listeners}
# HELP ${streamPrefix}_up Was the last scrape of Icecast successful.
# TYPE ${streamPrefix}_up gauge
${streamPrefix}_up 1`;
                });
            }
            res.send(metrics);
        } else {
            console.error(error);
            console.error(response);
            console.error(body);
            if(response){
                res.status(response.statusCode).send(error);
            }else{
                res.status(500).send(error);
            }
        }
    });
})

var server = app.listen(9146, function () {
    var host = server.address().address
    var port = server.address().port

    console.log("Example app listening at http://%s:%s", host, port)
})