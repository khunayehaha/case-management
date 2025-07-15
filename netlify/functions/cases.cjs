exports.handler = async (event, context) => {
    const req = {
        method: event.httpMethod,
        url: event.path,
        headers: event.headers,
        body: event.body
    };

    const res = {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json'
        },
        body: '',
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(data) {
            this.body = JSON.stringify(data);
            return this;
        },
        setHeader(key, value) {
            this.headers[key] = value;
        },
        end() {
            return {
                statusCode: this.statusCode,
                headers: this.headers,
                body: this.body
            };
        }
    };

    const result = await require('./api/cases.js')(req, res);
    return res.end();
};