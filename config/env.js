const env = {
    "jwtSecret": "customerUZA##123",
    "terminologyLang": ["en", "fr", "es", "de", "it", "ru", "ht", "zh"],
    "mongoAtlasUri": "mongodb://localhost:27017/test",
    "socketUrl": "",
    "socketIp": "",
    "socketUrlApi": "",
    "apiUrl": "https://test.com/authenticationservice/api/v1/",
    "apiBaseUrl": "https://test.com",
    // "apiUrl": "http://127.0.0.1:3089/api/v1/",
    // "apiBaseUrl": "http://127.0.0.1:3089",
    "AWS_SES": {
        "EMAIL_SOURCE": "info@ondemandcreations.com",
        "ACCESS_ID": "AKIAT3I4BCUAA6CA76WU",
        "SECRET_KEY": "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",
        "REGION_NAME": "us-east-2"
    },
    "AWS": {
        "SECRET_ACCESS_KEY": "IkX+x/86MiA3o3SvtaEqT1zkhONnxSzrDxdOGwaA",
        "SECRET_ACCESS_ID": "AKIA2G6LZX5AM57H23LW",
        "REGION_NAME": "us-east-2",
        "BUCKET_NAME": "uza-ecomm"
    },
    "twilio": {
        "accountSid": "",
        "authToken": "",
        "twilioFrom": ""
    },
    "mailgun": {
        "MAILGUN_API_KEY": "key-758aa69dd3ab8d90ee489d22d915ccfe",
        "MAILGUN_DOMAIN": "mg.ondemandcreations.com",
        "MAILGUN_FROM": "<no-reply@mg.ondemandcreations.com>"
    },
    "firebase": {
        "FCM_APIKEY": "",
        "FCM_AUTHDOMAIN": "",
        "FCM_DATABASEURL": "",
        "FCM_PROJECTID": "",
        "FCM_STORAGEBUCKET": "",
        "FCM_MESSAGINGSENDERID": "",
        "FCM_APPID": "",
        "FCM_MEASUREMENTID": "",
        "FCM_CLIENT_EMAIL": "",
        "FCM_PRIVATE_KEY": ""
    },
    DEFAULT_SKIP: 1,
    MAX_LIMIT: 10,
    DEFAULT_SORT_DIRECTION: -1,
    PORT: 3017,
    ROLE: "AFFILIATE",
    taxSettings: {
        level: "store",
        percentage: 2
    }
}

module.exports = env;
