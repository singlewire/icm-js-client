var rest = require('rest');
var mime = require('rest/interceptor/mime');
var errorCode = require('rest/interceptor/errorCode');
var defaultRequest = require('rest/interceptor/defaultRequest');

function isFunction(val) {
    return typeof val === 'function';
}

function isObject(val) {
    if (val === null) {
        return false;
    }
    return (typeof val === 'function') || (typeof val === 'object');
}

function merge() {
    var dst = {}, src, p, args = [].splice.call(arguments, 0);
    while (args.length > 0) {
        src = args.splice(0, 1)[0];
        if (toString.call(src) == '[object Object]') {
            for (p in src) {
                if (src.hasOwnProperty(p)) {
                    if (toString.call(src[p]) == '[object Object]') {
                        dst[p] = merge(dst[p] || {}, src[p]);
                    } else {
                        dst[p] = src[p];
                    }
                }
            }
        }
    }
    return dst;
}

function contains(array, value) {
    if (array) {
        return array.indexOf(value) !== -1;
    }
    return false;
}

function cloneDeep(obj) {
    if (obj == null || typeof(obj) != 'object') {
        return obj;
    }
    var temp = obj.constructor();
    for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
            temp[key] = cloneDeep(obj[key]);
        }
    }
    return temp;
}

function genReqFn(path, client, config, method, opts) {
    return function (params) {
        var fullUrl = '' + config.baseApiUrl + path;
        var requestParams = merge({method: method, path: fullUrl},
            opts.notJSON ? {} : {headers: {'Content-Type': 'application/json'}},
            params);
        return client(requestParams);
    };
}

function defSubResource(basePath, http, config) {
    return function (path, optionsOrCallback, callback) {
        return defResource('' + basePath + path, http, config, optionsOrCallback, callback);
    };
}

function defResource(path, http, config, optsOrCallback, callback) {
    return function (id) {
        var opts = isObject(optsOrCallback) ? optsOrCallback : {};
        if (id) {
            var subPath = path + '/' + id;
            var subResources = {};
            if (isFunction(optsOrCallback)) {
                subResources = optsOrCallback(defSubResource(subPath, http, config));
            } else if (isFunction(callback)) {
                subResources = callback(defSubResource(subPath, http, config));
            }
            return merge({},
                contains(opts.exclude, 'show') ? {} : {show: genReqFn(subPath, http, config, 'GET', opts)},
                contains(opts.exclude, 'remove') ? {} : {remove: genReqFn(subPath, http, config, 'DELETE', opts)},
                contains(opts.exclude, 'update') ? {} : {update: genReqFn(subPath, http, config, 'PUT', opts)},
                subResources);
        } else {
            return merge({},
                (!opts.noId ? {} : {get: genReqFn(path, http, config, 'GET', opts)}),
                contains(opts.exclude, 'list') ? {} : {list: genReqFn(path, http, config, 'GET', opts)},
                contains(opts.exclude, 'create') ? {} : {create: genReqFn(path, http, config, 'POST', opts)});
        }
    };
}

function ICMClient(config) {
    config = cloneDeep(config);

    if (!config) {
        throw Error('Config object must be present');
    } else if (!config.token) {
        throw Error('Token must be present in config')
    }

    config.baseApiUrl = ((config != null ? config.url : null) || 'https://api.icmobile.singlewire.com') + '/api/v1-DEV';

    var http = rest.wrap(mime)
        .wrap(errorCode)
        .wrap(defaultRequest, {
            headers: {
                'X-Client-Version': 'JSClient 0.0.1',
                Authorization: 'Bearer ' + config.token,
                Accept: 'application/json'
            }
        });

    http = isFunction(config.clientSetup) ? config.clientSetup(http) : http;

    return {
        users: defResource('/users', http, config, function (subResource) {
            return {
                subscriptions: subResource('/subscriptions'),
                devices: subResource('/devices'),
                locations: subResource('/locations'),
                tokens: subResource('/tokens', {exclude: ['update']}),
                notifications: subResource('/notifications', {exclude: ['update', 'create']}, function (subResource) {
                    return {
                        audio: subResource('/audio', {
                            exclude: ['update', 'create', 'remove', 'list', 'show'],
                            noId: true,
                            notJSON: true
                        }),
                        image: subResource('/image', {
                            exclude: ['update', 'create', 'remove', 'list', 'show'],
                            noId: true,
                            notJSON: true
                        }),
                        activities: subResource('/activities', {exclude: ['update', 'remove']})
                    };
                }),
                securityGroups: subResource('/security-groups'),
                userPermissions: subResource('/user-permissions')
            };
        }),
        securityGroups: defResource('/security-groups', http, config, function (subResource) {
            return {
                members: subResource('/members'),
                permissions: subResource('/permissions')
            };
        }),
        messageTemplates: defResource('/message-templates', http, config, function (subResource) {
            return {
                audio: subResource('/audio', {
                    exclude: ['update', 'create', 'remove', 'list', 'show'],
                    noId: true,
                    notJSON: true
                }),
                image: subResource('/image', {
                    exclude: ['update', 'create', 'remove', 'list', 'show'],
                    noId: true,
                    notJSON: true
                })
            };
        }),
        confirmationRequests: defResource('/confirmation-requests', http, config, function (subResource) {
            return {escalationRules: subResource('/escalation-rules')};
        }),
        areaOfInterests: defResource('/areas-of-interest', http, config, function (subResource) {
          return {
            boundaryTriggers: subResource('/boundary-triggers', function (subResource) {
              return {
                activities: subResource('/activities', {exclude: ['update', 'create', 'remove']})
              };
            }),
          };
        }),
        notifications: defResource('/notifications', http, config, function (subResource) {
            return {
                audio: subResource('/audio', {
                    exclude: ['update', 'create', 'remove', 'list', 'show'],
                    noId: true,
                    notJSON: true
                }),
                image: subResource('/image', {
                    exclude: ['update', 'create', 'remove', 'list', 'show'],
                    noId: true,
                    notJSON: true
                }),
                activities: subResource('/activities', {exclude: ['update', 'remove']}),
                recipients: subResource('/recipients', {exclude: ['update', 'create', 'remove']})
            };
        }),
        distributionLists: defResource('/distribution-lists', http, config, function (subResource) {
            return {userSubscriptions: subResource('/user-subscriptions')};
        }),
        loadDefinitions: defResource('/load-definitions', http, config, function (subResource) {
            return {
                securityGroupMappings: subResource('/security-group-mappings'),
                distributionListMappings: subResource('/distribution-list-mappings'),
                loadRequests: subResource('/load-requests', {exclude: ['update', 'remove']})
            };
        }),
        session: defResource('/session', http, config, {
            exclude: ['update', 'create', 'remove', 'list', 'show'],
            noId: true
        }),
        reports: defResource('/reports', http, config, {exclude: ['update', 'create', 'remove']}),
        extensions: defResource('/extensions', http, config, {exclude: ['update', 'remove']}),
        triggers: defResource('/triggers', http, config),
        paginate: function (promise, successCallback, errorCallback) {
            var self = this;
            return promise.then(function (response) {
                if (successCallback && successCallback(response) && response.entity && response.entity.next) {
                    var client = response.request.originator;
                    var originalRequestParams = cloneDeep(response.request);
                    delete originalRequestParams.cancel;
                    delete originalRequestParams.canceled;
                    delete originalRequestParams.originator;
                    var nextPageRequestParams = merge(originalRequestParams, {params: {start: response.entity.next}});
                    return self.paginate(client(nextPageRequestParams), successCallback, errorCallback);
                }
            }, function (error) {
                if (isFunction(errorCallback)) {
                    errorCallback(error)
                }
            });
        }
    };
}

module.exports = ICMClient;
