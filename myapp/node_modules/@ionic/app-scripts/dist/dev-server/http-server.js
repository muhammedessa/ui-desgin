"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var path = require("path");
var injector_1 = require("./injector");
var live_reload_1 = require("./live-reload");
var express = require("express");
var fs = require("fs");
var url = require("url");
var serve_config_1 = require("./serve-config");
var logger_1 = require("../logger/logger");
var proxyMiddleware = require("proxy-middleware");
var logger_diagnostics_1 = require("../logger/logger-diagnostics");
var Constants = require("../util/constants");
var helpers_1 = require("../util/helpers");
var ionic_project_1 = require("../util/ionic-project");
var lab_1 = require("./lab");
/**
 * Create HTTP server
 */
function createHttpServer(config) {
    var app = express();
    app.set('serveConfig', config);
    app.get('/', serveIndex);
    app.use('/', express.static(config.wwwDir));
    app.use("/" + serve_config_1.LOGGER_DIR, express.static(path.join(__dirname, '..', '..', 'bin'), { maxAge: 31536000 }));
    // Lab routes
    app.use(serve_config_1.IONIC_LAB_URL + '/static', express.static(path.join(__dirname, '..', '..', 'lab', 'static')));
    app.get(serve_config_1.IONIC_LAB_URL, lab_1.LabAppView);
    app.get(serve_config_1.IONIC_LAB_URL + '/api/v1/cordova', lab_1.ApiCordovaProject);
    app.get(serve_config_1.IONIC_LAB_URL + '/api/v1/app-config', lab_1.ApiPackageJson);
    app.get('/cordova.js', servePlatformResource, serveMockCordovaJS);
    app.get('/cordova_plugins.js', servePlatformResource);
    app.get('/plugins/*', servePlatformResource);
    if (config.useProxy) {
        setupProxies(app);
    }
    return app;
}
exports.createHttpServer = createHttpServer;
function setupProxies(app) {
    if (helpers_1.getBooleanPropertyValue(Constants.ENV_READ_CONFIG_JSON)) {
        ionic_project_1.getProjectJson().then(function (projectConfig) {
            for (var _i = 0, _a = projectConfig.proxies || []; _i < _a.length; _i++) {
                var proxy = _a[_i];
                var opts = url.parse(proxy.proxyUrl);
                if (proxy.proxyNoAgent) {
                    opts.agent = false;
                }
                opts.rejectUnauthorized = !(proxy.rejectUnauthorized === false);
                opts.cookieRewrite = proxy.cookieRewrite;
                app.use(proxy.path, proxyMiddleware(opts));
                logger_1.Logger.info('Proxy added:' + proxy.path + ' => ' + url.format(opts));
            }
        }).catch(function (err) {
            logger_1.Logger.error("Failed to read the projects ionic.config.json file: " + err.message);
        });
    }
}
/**
 * http responder for /index.html base entrypoint
 */
function serveIndex(req, res) {
    var config = req.app.get('serveConfig');
    // respond with the index.html file
    var indexFileName = path.join(config.wwwDir, process.env[Constants.ENV_VAR_HTML_TO_SERVE]);
    fs.readFile(indexFileName, function (err, indexHtml) {
        if (!indexHtml) {
            logger_1.Logger.error("Failed to load index.html");
            res.send('try again later');
            return;
        }
        if (config.useLiveReload) {
            indexHtml = live_reload_1.injectLiveReloadScript(indexHtml, req.hostname, config.liveReloadPort);
            indexHtml = injector_1.injectNotificationScript(config.rootDir, indexHtml, config.notifyOnConsoleLog, config.notificationPort);
        }
        indexHtml = logger_diagnostics_1.injectDiagnosticsHtml(config.buildDir, indexHtml);
        res.set('Content-Type', 'text/html');
        res.send(indexHtml);
    });
}
/**
 * http responder for cordova.js file
 */
function serveMockCordovaJS(req, res) {
    res.set('Content-Type', 'application/javascript');
    res.send('// mock cordova file during development');
}
/**
 * Middleware to serve platform resources
 */
function servePlatformResource(req, res, next) {
    return __awaiter(this, void 0, void 0, function () {
        var config, userAgent, root;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    config = req.app.get('serveConfig');
                    userAgent = req.header('user-agent');
                    if (!config.isCordovaServe) {
                        return [2 /*return*/, next()];
                    }
                    return [4 /*yield*/, getResourcePath(req.url, config, userAgent)];
                case 1:
                    root = _a.sent();
                    if (root) {
                        res.sendFile(req.url, { root: root });
                    }
                    else {
                        next();
                    }
                    return [2 /*return*/];
            }
        });
    });
}
/**
 * Determines the appropriate resource path, and checks if the specified url
 *
 * @returns string of the resource path or undefined if there is no match
 */
function getResourcePath(url, config, userAgent) {
    return __awaiter(this, void 0, void 0, function () {
        var searchPaths, i, checkPath, result, e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    searchPaths = [config.wwwDir];
                    if (isUserAgentIOS(userAgent)) {
                        searchPaths = serve_config_1.IOS_PLATFORM_PATHS.map(function (resourcePath) { return path.join(config.rootDir, resourcePath); });
                    }
                    else if (isUserAgentAndroid(userAgent)) {
                        searchPaths = serve_config_1.ANDROID_PLATFORM_PATHS.map(function (resourcePath) { return path.join(config.rootDir, resourcePath); });
                    }
                    i = 0;
                    _a.label = 1;
                case 1:
                    if (!(i < searchPaths.length)) return [3 /*break*/, 6];
                    checkPath = path.join(searchPaths[i], url);
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, , 5]);
                    return [4 /*yield*/, checkFile(checkPath)];
                case 3:
                    result = _a.sent();
                    return [2 /*return*/, searchPaths[i]];
                case 4:
                    e_1 = _a.sent();
                    return [3 /*break*/, 5];
                case 5:
                    i++;
                    return [3 /*break*/, 1];
                case 6: return [2 /*return*/];
            }
        });
    });
}
/**
 * Checks if a file exists (responds to stat)
 */
function checkFile(filePath) {
    return new Promise(function (resolve, reject) {
        fs.stat(filePath, function (err, stats) {
            if (err) {
                return reject();
            }
            resolve();
        });
    });
}
function isUserAgentIOS(ua) {
    ua = ua.toLowerCase();
    return (ua.indexOf('iphone') > -1 || ua.indexOf('ipad') > -1 || ua.indexOf('ipod') > -1);
}
function isUserAgentAndroid(ua) {
    ua = ua.toLowerCase();
    return ua.indexOf('android') > -1;
}
