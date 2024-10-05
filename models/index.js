const fs = require('fs');
exports.setup = function (mongoose) {
    const promise = new Promise((resolve, reject) => {
        var models = {};
        fs.readdir(__dirname, function (err, files) {
            for (var i in files) {
                if (files[i] == 'index.js')
                    continue;
                if (files[i].split('.').length > 2)
                    continue;
                try {
                    var t = require('./' + files[i]);

                    // models[t.name] = mongoose.model(t.name, t.schema);

                } catch (e) {
                    console.log(e)
                }

            }
            global._models = models;
            resolve('promise resolved');
        });
    });
    return promise;
};

function isUsersReferenceFiles(fileName) {
    const includes = require('lodash.includes');

    const referenceUserFile = [
    ]
    return includes(referenceUserFile, fileName)
}