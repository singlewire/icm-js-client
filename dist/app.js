var ICMClient, Promise, assert, defResource, defSubResource, genReqFn, request, _;

Promise = require('promise');

assert = require('assert');

request = require('request');

_ = require('lodash');

genReqFn = function(path, http, config, method, paginate, options) {
  var get;
  get = function(params) {
    var requestMethod, requestParams, uri;
    uri = "" + ((config != null ? config.url : void 0) || 'https://api.singlewire.com') + "/api/v1-DEV" + path;
    requestParams = _.merge({}, (!options.notJSON ? {
      json: true
    } : void 0), params);
    requestMethod = http[method.toLowerCase()];
    return new Promise(function(resolve, reject) {
      return requestMethod(uri, requestParams, function(error, httpResponse, response) {
        if (!error && httpResponse.statusCode === 200) {
          if (paginate) {
            response.hasNextPage = response.next ? true : false;
            response.getNextPage = response.next ? _.partial(get, _.merge(params, {
              form: {
                start: response.next
              }
            })) : _.noop;
          }
          return resolve(response);
        } else {
          return reject([error, httpResponse, response]);
        }
      });
    });
  };
  return get;
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
        show: genReqFn(subPath, http, config, 'GET', false, opts)
      } : void 0), (!_.contains(opts.exclude, 'remove') ? {
        remove: genReqFn(subPath, http, config, 'DEL', false, opts)
      } : void 0), (!_.contains(opts.exclude, 'update') ? {
        update: genReqFn(subPath, http, config, 'PUT', false, opts)
      } : void 0), subResources);
    } else {
      return _.merge({}, (opts.noId ? {
        get: genReqFn(path, http, config, 'GET', false, opts)
      } : void 0), (!_.contains(opts.exclude, 'list') ? {
        list: genReqFn(path, http, config, 'GET', true, opts)
      } : void 0), (!_.contains(opts.exclude, 'create') ? {
        create: genReqFn(path, http, config, 'POST', false, opts)
      } : void 0));
    }
  };
};

ICMClient = function(config) {
  var http;
  assert(config, 'Config object must be present');
  assert(config.token, 'Token must be present in config');
  http = request.defaults(_.merge({}, config.requestDefaults, {
    headers: {
      'X-Client-Version': 'NodejsClient 0.0.1',
      Authorization: "Bearer " + config.token
    }
  }));
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
        var shouldContinue;
        shouldContinue = typeof successCallback === "function" ? successCallback(response) : void 0;
        if (shouldContinue && response.hasNextPage) {
          return self.paginate(response.getNextPage(), successCallback, errorCallback);
        }
      }, function(error) {
        return typeof errorCallback === "function" ? errorCallback(error) : void 0;
      });
    }
  };
};

module.exports = ICMClient;
