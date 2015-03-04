var ICMClient, assert, defResource, defSubResource, defaultRequest, errorCode, genReqFn, mime, rest, _;

assert = require('assert');

_ = require('lodash');

rest = require('rest');

mime = require('rest/interceptor/mime');

errorCode = require('rest/interceptor/errorCode');

defaultRequest = require('rest/interceptor/defaultRequest');

genReqFn = function(path, client, config, method, opts) {
  return function(params) {
    var fullUrl, requestParams;
    fullUrl = "" + config.baseApiUrl + path;
    requestParams = _.merge({
      method: method,
      path: fullUrl
    }, (!opts.notJSON ? {
      headers: {
        'Content-Type': 'application/json'
      }
    } : void 0), params);
    return client(requestParams);
  };
};

defSubResource = function(basePath, http, config) {
  return function(path, optionsOrCallback, callback) {
    return defResource("" + basePath + path, http, config, optionsOrCallback, callback);
  };
};

defResource = function(path, http, config, optsOrCallback, callback) {
  return function(id) {
    var opts, subPath, subResources;
    opts = _.isObject(optsOrCallback) ? optsOrCallback : {};
    if (id) {
      subPath = "" + path + "/" + id;
      subResources = {};
      if (_.isFunction(optsOrCallback)) {
        subResources = optsOrCallback(defSubResource(subPath, http, config));
      } else if (_.isFunction(callback)) {
        subResources = callback(defSubResource(subPath, http, config));
      }
      return _.merge({}, (!_.contains(opts.exclude, 'show') ? {
        show: genReqFn(subPath, http, config, 'GET', opts)
      } : void 0), (!_.contains(opts.exclude, 'remove') ? {
        remove: genReqFn(subPath, http, config, 'DELETE', opts)
      } : void 0), (!_.contains(opts.exclude, 'update') ? {
        update: genReqFn(subPath, http, config, 'PUT', opts)
      } : void 0), subResources);
    } else {
      return _.merge({}, (opts.noId ? {
        get: genReqFn(path, http, config, 'GET', opts)
      } : void 0), (!_.contains(opts.exclude, 'list') ? {
        list: genReqFn(path, http, config, 'GET', opts)
      } : void 0), (!_.contains(opts.exclude, 'create') ? {
        create: genReqFn(path, http, config, 'POST', opts)
      } : void 0));
    }
  };
};

ICMClient = function(config) {
  var http;
  config = _.cloneDeep(config);
  assert(config, 'Config object must be present');
  assert(config.token, 'Token must be present in config');
  config.baseApiUrl = "" + ((config != null ? config.url : void 0) || 'https://api.singlewire.com') + "/api/v1-DEV";
  http = rest.wrap(mime).wrap(errorCode).wrap(defaultRequest, {
    headers: {
      'X-Client-Version': 'JSClient 0.0.1',
      Authorization: "Bearer " + config.token,
      Accept: 'application/json'
    }
  });
  http = _.isFunction(config.clientSetup) ? config.clientSetup(http) : http;
  return {
    users: defResource('/users', http, config, function(subResource) {
      return {
        subscriptions: subResource('/subscriptions'),
        devices: subResource('/devices'),
        tokens: subResource('/tokens', {
          exclude: ['update']
        }),
        notifications: subResource('/notifications', {
          exclude: ['update', 'create']
        }, function(subResource) {
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
            activities: subResource('/activities', {
              exclude: ['update', 'remove']
            })
          };
        }),
        securityGroups: subResource('/security-groups'),
        userPermissions: subResource('/user-permissions')
      };
    }),
    securityGroups: defResource('/security-groups', http, config, function(subResource) {
      return {
        members: subResource('/members'),
        permissions: subResource('/permissions')
      };
    }),
    messageTemplates: defResource('/message-templates', http, config, function(subResource) {
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
    confirmationRequests: defResource('/confirmation-requests', function(subResource) {
      return {
        escalationRules: subResource('/escalation-rules')
      };
    }),
    notifications: defResource('/notifications', http, config, function(subResource) {
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
        activities: subResource('/activities', {
          exclude: ['update', 'remove']
        }),
        recipients: subResource('/recipients', {
          exclude: ['update', 'create', 'remove']
        })
      };
    }),
    distributionLists: defResource('/distribution-lists', http, config, function(subResource) {
      return {
        userSubscriptions: subResource('/user-subscriptions')
      };
    }),
    loadDefinitions: defResource('/load-definitions', http, config, function(subResource) {
      return {
        securityGroupMappings: subResource('/security-group-mappings'),
        distributionListMappings: subResource('/distribution-list-mappings'),
        loadRequests: subResource('/load-requests', {
          exclude: ['update', 'remove']
        })
      };
    }),
    session: defResource('/session', http, config, {
      exclude: ['update', 'create', 'remove', 'list', 'show'],
      noId: true
    }),
    paginate: function(promise, successCallback, errorCallback) {
      var self;
      self = this;
      return promise.then(function(response) {
        var client, nextPageRequestParams, originalRequestParams, shouldContinue, _ref;
        shouldContinue = typeof successCallback === "function" ? successCallback(response) : void 0;
        if (shouldContinue && ((_ref = response.entity) != null ? _ref.next : void 0)) {
          client = response.request.originator;
          originalRequestParams = _.omit(response.request, 'cancel', 'canceled', 'originator');
          nextPageRequestParams = _.merge(originalRequestParams, {
            params: {
              start: response.entity.next
            }
          });
          return self.paginate(client(nextPageRequestParams), successCallback, errorCallback);
        }
      }, function(error) {
        return typeof errorCallback === "function" ? errorCallback(error) : void 0;
      });
    }
  };
};

module.exports = ICMClient;
