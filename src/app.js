var _ = require('lodash');
var rest = require('rest');
var mime = require('rest/interceptor/mime');
var errorCode = require('rest/interceptor/errorCode');
var defaultRequest = require('rest/interceptor/defaultRequest');

function genReqFn(path, client, config, method, opts) {
    return function (params) {
        var fullUrl = '' + config.baseApiUrl + path;
        var requestParams = _.merge({method: method, path: fullUrl},
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
        var opts = _.isObject(optsOrCallback) ? optsOrCallback : {};
        if (id) {
            var subPath = path + '/' + id;
            var subResources = {};
            if (_.isFunction(optsOrCallback)) {
                subResources = optsOrCallback(defSubResource(subPath, http, config));
            } else if (_.isFunction(callback)) {
                subResources = callback(defSubResource(subPath, http, config));
            }
            return _.merge({},
                _.contains(opts.exclude, 'show') ? {} : {show: genReqFn(subPath, http, config, 'GET', opts)},
                _.contains(opts.exclude, 'remove') ? {} : {remove: genReqFn(subPath, http, config, 'DELETE', opts)},
                _.contains(opts.exclude, 'update') ? {} : {update: genReqFn(subPath, http, config, 'PUT', opts)},
                subResources);
        } else {
            return _.merge({},
                (!opts.noId ? {} : {get: genReqFn(path, http, config, 'GET', opts)}),
                _.contains(opts.exclude, 'list') ? {} : {list: genReqFn(path, http, config, 'GET', opts)},
                _.contains(opts.exclude, 'create') ? {} : {create: genReqFn(path, http, config, 'POST', opts)});
        }
    };
}

function ICMClient(config) {
    config = _.cloneDeep(config);

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

    http = _.isFunction(config.clientSetup) ? config.clientSetup(http) : http;

    return {
        users: defResource('/users', http, config, function (subResource) {
            return {
                subscriptions: subResource('/subscriptions'),
                devices: subResource('/devices'),
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
        confirmationRequests: defResource('/confirmation-requests', function (subResource) {
            return {escalationRules: subResource('/escalation-rules')};
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
        triggers: defResource('/triggers', http, config),
        paginate: function (promise, successCallback, errorCallback) {
            var self = this;
            return promise.then(function (response) {
                if (successCallback && successCallback(response) && response.entity && response.entity.next) {
                    var client = response.request.originator;
                    var originalRequestParams = _.omit(response.request, 'cancel', 'canceled', 'originator');
                    var nextPageRequestParams = _.merge(originalRequestParams, {params: {start: response.entity.next}});
                    return self.paginate(client(nextPageRequestParams), successCallback, errorCallback);
                }
            }, function (error) {
                if (_.isFunction(errorCallback)) {
                    errorCallback(error)
                }
            });
        }
    };
}

module.exports = ICMClient;
