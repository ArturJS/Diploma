module.exports = {
    log4js: {
        appenders: [
            {   type: 'file',
                filename: "./logs/error.log",
                category: 'error',
                maxLogSize: 20480,
                backups: 10
            },
            {   type: "file",
                filename: "./logs/info.log",
                category: 'info',
                maxLogSize: 20480,
                backups: 10
            },
            {   type: 'file',
                filename: "./logs/debug.log",
                category: 'debug',
                maxLogSize: 20480,
                backups: 10
            }
        ]
    }
};