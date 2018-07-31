"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var path = require("path");
exports.LOGGER_DIR = '__ion-dev-server';
exports.IONIC_LAB_URL = '/ionic-lab';
exports.IOS_PLATFORM_PATHS = [path.join('platforms', 'ios', 'www')];
exports.ANDROID_PLATFORM_PATHS = [
    path.join('platforms', 'android', 'assets', 'www'),
    path.join('platforms', 'android', 'app', 'src', 'main', 'assets', 'www')
];
