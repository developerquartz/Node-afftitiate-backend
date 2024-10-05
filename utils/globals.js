
//Here  declaraning global variable;

global.logger = require("../config/logger");

// Set environment variables based on NODE_ENV
const envFile = process.env.NODE_ENV === 'production' ? '../config/env' : '../config/env-stagging';
global.env = require(envFile)
